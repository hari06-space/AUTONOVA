import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  useTheme
} from '@mui/material';
import {
  IconMail,
  IconEye,
  IconAlertTriangle,
  IconSend,
  IconCheck
} from '@tabler/icons-react';
import BOSFormDialog from 'ui-component/bos/BOSFormDialog';
import BOSTextField from 'ui-component/bos/BOSTextField';
import BOSAutocomplete from 'ui-component/bos/BOSAutocomplete';
import ReactQuill from 'ui-component/third-party/ReactQuill';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import { buildOfferLetterDocumentModel, resolveCandidateEmail } from 'utils/offerLetterDocumentModel';
import { getDisplayString } from 'ui-component/bos';
import { generateOfferLetterPdfArtifact } from 'utils/digitalPdfExport';

export default function SendOfferLetterDialog({
  open,
  onClose,
  offerLetter = null,
  initialModel = null,
  initialPdfArtifact = null,
  onSuccess = null
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [emailSenderInfo, setEmailSenderInfo] = useState({ email: '', isCompanyFallback: false });
  const [companySmtpEmail, setCompanySmtpEmail] = useState('');
  const [useCompanyMail, setUseCompanyMail] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  const [fetchedCompanyInfo, setFetchedCompanyInfo] = useState(null);

  const [canonicalModel, setCanonicalModel] = useState(initialModel || offerLetter?.canonicalModel || null);
  const [cachedArtifact, setCachedArtifact] = useState(initialPdfArtifact || offerLetter?.pdfArtifact || null);

  const [offerLetterData, setOfferLetterData] = useState({
    from: '',
    to: '',
    cc: ''
  });
  const [offerLetterErrors, setOfferLetterErrors] = useState({});

  const [activeEmployeeList, setActiveEmployeeList] = useState([]);
  const [activeCompsList, setActiveCompsList] = useState(offerLetter?.activeCompsList || []);
  const [fullOfferRecord, setFullOfferRecord] = useState(offerLetter || null);

  // Fetch active payroll components
  useEffect(() => {
    if (!open) return;
    const fetchPayrollComps = async () => {
      try {
        const empId = offerLetter?.employeeId || offerLetter?.applicantId || offerLetter?.candidateId || 0;
        const empType = offerLetter?.employmentType || offerLetter?.employeeType;
        const empTypeParam = empType ? `?employeeType=${encodeURIComponent(empType)}` : '';
        if (empId || empType) {
          try {
            const empRes = await axios.get(`/api/master/hr/employees/${empId || 0}/payroll-components${empTypeParam}`);
            if (Array.isArray(empRes.data) && empRes.data.length > 0) {
              setActiveCompsList(empRes.data);
              return;
            }
          } catch (_) { }
        }
        const res = await axios.get('/api/payroll/components');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setActiveCompsList(res.data.filter(c => c.isActive !== false));
        }
      } catch (_) { }
    };
    fetchPayrollComps();
  }, [open, offerLetter]);

  // Preview Dialog State
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState({
    subject: '',
    bodyContent: '',
    htmlPreview: '',
    yoursWindfully: ''
  });

  // Fetch company SMTP email and sender details
  useEffect(() => {
    if (!open) return;

    const fetchSenderAndCompany = async () => {
      try {
        const [senderRes, compRes] = await Promise.allSettled([
          axios.get('/api/hra/letters/email-sender-info'),
          axios.get('/api/company-profile/all')
        ]);

        let resolvedSender = '';
        let isFallback = false;

        if (senderRes.status === 'fulfilled' && senderRes.value?.data) {
          resolvedSender = senderRes.value.data.email || '';
          isFallback = !!senderRes.value.data.isCompanyFallback;
          setEmailSenderInfo({ email: resolvedSender, isCompanyFallback: isFallback });
          setShowEmailWarning(isFallback);
        }

        let compMail = '';
        if (compRes.status === 'fulfilled' && Array.isArray(compRes.value?.data) && compRes.value.data.length > 0) {
          const compData = compRes.value.data;
          const activeCompName = localStorage.getItem('companyName') || sessionStorage.getItem('companyName');
          const matched = compData.find(c => c.companyName === activeCompName) || compData[0];
          if (matched) {
            if (matched.smtpUsername || matched.emailId) {
              compMail = matched.smtpUsername || matched.emailId;
              setCompanySmtpEmail(compMail);
            }
            const addressParts = [matched.address, matched.city, matched.state].filter(Boolean);
            const fullAddress = addressParts.join(', ') + (matched.pincode ? ` - ${matched.pincode}` : '');
            setFetchedCompanyInfo({
              companyName: matched.companyName || '',
              companyAddress: fullAddress || matched.address || '',
              companyGstin: matched.gstIn || '',
              companyPhone: matched.phoneNo || matched.mobileNo || '',
              companyEmail: matched.emailId || '',
              companyWeb: matched.website || '',
              companyLogo: matched.logoFileName ? getCompanyImageUrl(matched.logoFileName) : (matched.companyLogo || ''),
              logoFileName: matched.logoFileName || '',
              hrName: senderRes.value?.data?.name || '',
              hrDesignation: senderRes.value?.data?.designation || 'HR Manager'
            });
          }
        }

        setUseCompanyMail(isFallback);
        setOfferLetterData(prev => ({
          ...prev,
          from: isFallback ? (compMail || resolvedSender) : resolvedSender
        }));
      } catch (err) {
        console.warn('Failed to load email sender information:', err);
      }
    };

    fetchSenderAndCompany();
  }, [open]);

  // Fetch active employee office emails list for CC autocomplete (exact ATS flow)
  useEffect(() => {
    if (!open) return;

    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/api/master/hr/employees/active-office-mails');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setActiveEmployeeList(res.data);
          return;
        }
      } catch (e) { }

      try {
        const res = await axios.get('/api/master/hr/employees/filter/active');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setActiveEmployeeList(res.data);
          return;
        }
      } catch (e) { }

      try {
        const res = await axios.get('/api/master/hr/employees');
        if (Array.isArray(res.data)) {
          setActiveEmployeeList(res.data);
        }
      } catch (err) {
        console.warn('Failed to load employees for CC dropdown:', err);
      }
    };

    fetchEmployees();
  }, [open]);

  // Prepopulate candidate data when offerLetter or dialog changes
  useEffect(() => {
    if (!open || !offerLetter) return;
    setFullOfferRecord(offerLetter);

    if (initialModel) {
      setCanonicalModel(initialModel);
    } else if (offerLetter?.canonicalModel) {
      setCanonicalModel(offerLetter.canonicalModel);
    } else {
      setCanonicalModel(null);
    }

    if (initialPdfArtifact) {
      setCachedArtifact(initialPdfArtifact);
    } else if (offerLetter?.pdfArtifact) {
      setCachedArtifact(offerLetter.pdfArtifact);
    } else {
      setCachedArtifact(null);
    }

    // Resolve candidate email from authoritative fields
    let candidateEmail = resolveCandidateEmail(offerLetter) || resolveCandidateEmail(offerLetter.fullRecord) || '';
    if (!candidateEmail && offerLetter.formData) {
      let parsed = offerLetter.formData;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch (e) { }
      }
      if (parsed && typeof parsed === 'object') {
        candidateEmail = resolveCandidateEmail(parsed) || '';
      }
    }

    const effectiveFrom = emailSenderInfo.isCompanyFallback
      ? (companySmtpEmail || emailSenderInfo.email || '')
      : (emailSenderInfo.email || companySmtpEmail || '');

    setOfferLetterData({
      from: effectiveFrom,
      to: candidateEmail || '',
      cc: ''
    });
    setOfferLetterErrors({});
    setShowEmailWarning(false);

    // Fetch full detail if offerLetter has ID to guarantee complete salary structure & formData
    if (offerLetter.id) {
      axios.get(`/api/hra/letters/${offerLetter.id}`).then(res => {
        if (res.data) {
          let p = res.data.formData;
          if (typeof p === 'string') {
            try { p = JSON.parse(p); } catch (e) { }
          }
          setFullOfferRecord(prev => ({
            ...prev,
            ...res.data,
            ...p,
            fullRecord: {
              ...res.data,
              ...p
            }
          }));
          const fetchedMail = resolveCandidateEmail(p) || resolveCandidateEmail(res.data) || '';
          if (fetchedMail) {
            setOfferLetterData(prev => ({ ...prev, to: fetchedMail }));
          }
        }
      }).catch(() => { });
    }
  }, [open, offerLetter, emailSenderInfo, companySmtpEmail, initialModel, initialPdfArtifact]);

  // Active employee mail options for CC
  const activeEmployeeMailOptions = useMemo(() => {
    const list = [];
    const seen = new Set();

    (activeEmployeeList || []).forEach(emp => {
      if (!emp) return;
      const mail = String(emp.officeMail || emp.officeEmail || emp.organization?.officeMail || '').trim();
      if (!mail) return;

      const code = emp.oldEmpCode || emp.empCode || emp.applicantCode || '';
      const name = (emp.employeeName || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || emp.firstName || '').trim();
      const label = name ? `${name}${code ? ` (${code})` : ''} - ${mail}` : (code ? `${code} - ${mail}` : mail);

      const key = `${emp.id || code || name}_${mail}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          label,
          value: mail,
          mail,
          name,
          code,
          photoPath: emp.employeePhotoUpload || emp.photoPath
        });
      }
    });

    return list;
  }, [activeEmployeeList]);

  // Offer Letter CC array for BOSAutocomplete
  const offerLetterCcArray = useMemo(() => {
    if (!offerLetterData.cc) return [];
    return offerLetterData.cc
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);
  }, [offerLetterData.cc]);

  // Form Validation
  const validateForm = () => {
    const errs = {};
    const effectiveFrom = useCompanyMail
      ? (companySmtpEmail || emailSenderInfo.email)
      : (offerLetterData.from || emailSenderInfo.email || companySmtpEmail);

    if (!effectiveFrom || !effectiveFrom.trim()) {
      errs.from = 'Unable to send email because sender email is not configured.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveFrom.trim())) {
      errs.from = 'Invalid sender email address.';
    }

    if (!offerLetterData.to || !offerLetterData.to.trim()) {
      errs.to = 'Candidate To email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(offerLetterData.to.trim())) {
      errs.to = 'Invalid candidate email address.';
    }

    if (offerLetterData.cc && offerLetterData.cc.trim()) {
      const ccEmails = offerLetterData.cc.split(',').map(e => e.trim()).filter(Boolean);
      const invalidEmail = ccEmails.find(e => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      if (invalidEmail) {
        errs.cc = `Invalid CC email address: ${invalidEmail}`;
      }
    }

    return errs;
  };

  const handlePreviewOfferLetter = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setOfferLetterErrors(errs);
      const msg = errs.cc || errs.to || errs.from || 'Please resolve the validation errors first.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setPreviewLoading(true);
    try {
      const effectiveFrom = useCompanyMail
        ? (companySmtpEmail || emailSenderInfo.email)
        : (offerLetterData.from || emailSenderInfo.email || companySmtpEmail);

      const effectiveOffer = fullOfferRecord || offerLetter;
      const modelToUse = canonicalModel || buildOfferLetterDocumentModel(effectiveOffer, {
        companyInfo: fetchedCompanyInfo,
        activeCompsList: activeCompsList
      });

      const { data } = await axios.post('/api/hra/letters/email-template-preview', {
        offerLetterId: effectiveOffer?.id,
        applicantId: effectiveOffer?.applicantId || effectiveOffer?.candidateId || effectiveOffer?.employeeId,
        fromEmail: effectiveFrom,
        toEmail: offerLetterData.to,
        ccEmail: offerLetterData.cc,
        candidateName: modelToUse.candidateData.candidateName,
        applicantCode: modelToUse.candidateData.applicantCode,
        department: modelToUse.candidateData.department,
        designation: modelToUse.candidateData.designation,
        position: modelToUse.candidateData.designation,
        companyName: modelToUse.companyData.companyName,
        companyAddress: modelToUse.companyData.companyAddress,
        joiningDate: modelToUse.candidateData.joiningDate,
        totalCTC: modelToUse.salaryData.annualCtc,
        basicSalary: modelToUse.localSalary?.basicPay || modelToUse.localSalary?.BASIC || 0,
        validityDays: '2',
        formData: effectiveOffer?.formData,
        fullRecord: effectiveOffer?.fullRecord || effectiveOffer
      });

      setEmailPreviewData({
        subject: data.subject || '',
        bodyContent: data.bodyContent || '',
        htmlPreview: data.htmlPreview || data.fullMasterHtml || '',
        yoursWindfully: data.yoursWindfully || ''
      });
      setEmailPreviewOpen(true);
    } catch (e) {
      const msg = e.response?.data?.message || 'No active email template found for OFFER LETTER. Please verify in Email Content Master.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendOfferLetterSubmit = async (customSubject = null, customBody = null) => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setOfferLetterErrors(errs);
      const msg = errs.cc || errs.to || errs.from || 'Please resolve the validation errors.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    setLoading(true);
    try {
      const effectiveFrom = useCompanyMail
        ? (companySmtpEmail || emailSenderInfo.email)
        : (offerLetterData.from || emailSenderInfo.email || companySmtpEmail);

      const effectiveOffer = fullOfferRecord || offerLetter;
      const refNo = (effectiveOffer?.refNo || effectiveOffer?.offerLetterNo || 'OfferLetter').replaceAll(/[^a-zA-Z0-9_.-]/g, '_');
      const pdfFileName = `Offer_Letter_${refNo}.pdf`;

      // Resolve the single authoritative canonical document model
      const modelToUse = canonicalModel || buildOfferLetterDocumentModel(effectiveOffer, {
        companyInfo: fetchedCompanyInfo,
        activeCompsList: activeCompsList
      });

      // Obtain the exact PDF artifact (reuse if precomputed for this exact state, otherwise generate canonically)
      let pdfBase64 = null;
      try {
        if (cachedArtifact && cachedArtifact.dataUri) {
          pdfBase64 = cachedArtifact.dataUri;
        } else {
          const artifact = await generateOfferLetterPdfArtifact(modelToUse, pdfFileName);
          pdfBase64 = artifact.dataUri;
          setCachedArtifact(artifact);
        }
      } catch (pdfErr) {
        console.error('[OfferLetterPDF] Failed to generate authoritative PDF artifact:', pdfErr);
        throw new Error('Failed to generate Offer Letter PDF attachment: ' + (pdfErr?.message || 'Rendering error'));
      }

      if (!pdfBase64 || !pdfBase64.trim()) {
        throw new Error('Offer Letter PDF attachment generation yielded empty content.');
      }

      const { data } = await axios.post('/api/hra/letters/send-offer-letter', {
        offerLetterId: effectiveOffer?.id,
        applicantId: effectiveOffer?.applicantId || effectiveOffer?.candidateId || effectiveOffer?.employeeId,
        fromEmail: effectiveFrom,
        toEmail: offerLetterData.to,
        ccEmail: offerLetterData.cc,
        customSubject: customSubject,
        customBody: customBody,
        useCompanyMail: useCompanyMail,
        pdfBase64: pdfBase64,
        pdfFileName: pdfFileName,
        candidateName: modelToUse.candidateData.candidateName,
        applicantCode: modelToUse.candidateData.applicantCode,
        department: modelToUse.candidateData.department,
        designation: modelToUse.candidateData.designation,
        position: modelToUse.candidateData.designation,
        companyName: modelToUse.companyData.companyName,
        companyAddress: modelToUse.companyData.companyAddress,
        joiningDate: modelToUse.candidateData.joiningDate,
        totalCTC: modelToUse.salaryData.annualCtc,
        basicSalary: modelToUse.localSalary?.basicPay || modelToUse.localSalary?.BASIC || 0,
        validityDays: '2',
        formData: effectiveOffer?.formData,
        fullRecord: effectiveOffer?.fullRecord || effectiveOffer
      });

      dispatch(openSnackbar({
        open: true,
        message: data.message || `Offer letter email with PDF attachment successfully dispatched to ${offerLetterData.to}.`,
        variant: 'alert',
        severity: 'success'
      }));

      setEmailPreviewOpen(false);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send offer letter email. Please try again.';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick') return;
    onClose();
  };

  const errorStyle = (isError) => isError ? {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: 'error.main' }
    }
  } : {};

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={handleClose}
        title="Send Offer Letter"
        maxWidth="md"
        secondaryActions={
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={handlePreviewOfferLetter}
              variant="outlined"
              color="primary"
              disabled={previewLoading}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                px: 3,
                py: 1,
                fontWeight: 700
              }}
              startIcon={previewLoading ? <CircularProgress size={16} /> : <IconEye size={18} />}
            >
              Preview Email
            </Button>
            <Tooltip title="Send Offer Letter (Space + S)">
              <span>
                <Button
                  data-shortcut="save"
                  onClick={() => handleSendOfferLetterSubmit()}
                  variant="contained"
                  disabled={loading}
                  sx={{
                    bgcolor: 'success.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'success.dark', transform: 'translateY(-2px)', boxShadow: 6 },
                    borderRadius: '24px',
                    textTransform: 'none',
                    px: 4,
                    py: 1,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)'
                  }}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconMail size={20} />}
                >
                  {loading ? 'Sending...' : 'Send'}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      >
        <Stack spacing={2.5} width="100%">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} width="100%">
            {/* Left Column: From + Company Mail */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#b3bec9' : '#475569' }}>From:</span>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isDark ? '#b3bec9' : '#6b7280' }}>Use Company Mail</span>
                    <span
                      role="switch"
                      aria-checked={useCompanyMail}
                      tabIndex={0}
                      onClick={() => {
                        if (emailSenderInfo.isCompanyFallback) {
                          setShowEmailWarning(prev => !prev);
                        } else {
                          setUseCompanyMail(prev => !prev);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (emailSenderInfo.isCompanyFallback) {
                            setShowEmailWarning(prev => !prev);
                          } else {
                            setUseCompanyMail(prev => !prev);
                          }
                        }
                      }}
                      style={{
                        width: '28px',
                        height: '16px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        padding: '0 2px',
                        background: useCompanyMail ? '#22c55e' : '#cbd5e1'
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          transition: 'transform 0.2s',
                          transform: useCompanyMail ? 'translateX(12px)' : 'translateX(2px)'
                        }}
                      />
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '20px', color: isDark ? '#b3bec9' : '#475569' }}>
                      {useCompanyMail ? 'Yes' : 'No'}
                    </span>
                  </label>
                </div>

                <input
                  type="email"
                  value={useCompanyMail ? (companySmtpEmail || emailSenderInfo.email || 'Company Email') : (offerLetterData.from || emailSenderInfo.email || '')}
                  disabled={true}
                  style={{
                    width: '100%',
                    height: '40px',
                    boxSizing: 'border-box',
                    padding: '0 12px',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isDark ? '#30363d' : '#cbd5e1',
                    boxShadow: 'none',
                    outline: 'none',
                    backgroundColor: isDark ? '#161b22' : '#f1f5f9',
                    transition: 'all 0.15s ease-in-out',
                    fontFamily: theme.typography.fontFamily,
                    color: isDark ? '#8b949e' : '#64748b',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {showEmailWarning && (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: isDark ? 'rgba(251, 191, 36, 0.05)' : 'rgba(251, 191, 36, 0.1)',
                    color: isDark ? '#fbbf24' : '#b78103',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <IconAlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                    No office email is configured for your account. Emails will be sent using the Company Email configured in Company Credentials.
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Right Column: To + CC */}
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <BOSTextField
                required
                disabled={true}
                label="To:"
                name="to"
                value={offerLetterData.to}
                onChange={(e) => {
                  setOfferLetterData(prev => ({ ...prev, to: e.target.value.toLowerCase() }));
                  if (offerLetterErrors.to) {
                    setOfferLetterErrors(prev => ({ ...prev, to: '' }));
                  }
                }}
                error={!!offerLetterErrors.to}
                helperText={offerLetterErrors.to}
                sx={errorStyle(!!offerLetterErrors.to)}
              />

              <BOSAutocomplete
                multiple
                freeSolo
                label="CC:"
                name="cc"
                options={activeEmployeeMailOptions}
                value={offerLetterCcArray}
                onChange={(val) => {
                  const selectedMails = (Array.isArray(val) ? val : [val])
                    .map(item => {
                      if (typeof item === 'object' && item !== null) {
                        return item.value || item.mail || item.label || '';
                      }
                      return String(item || '').trim();
                    })
                    .filter(Boolean)
                    .map(m => m.toLowerCase());
                  const commaString = selectedMails.join(', ');
                  setOfferLetterData(prev => ({ ...prev, cc: commaString }));
                  if (offerLetterErrors.cc) {
                    setOfferLetterErrors(prev => ({ ...prev, cc: '' }));
                  }
                }}
                error={!!offerLetterErrors.cc}
                helperText={offerLetterErrors.cc}
                sx={errorStyle(!!offerLetterErrors.cc)}
                placeholder={offerLetterCcArray.length > 0 ? '' : "Select Employee Office Mail or type manually..."}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  const mail = typeof option === 'object' ? (option.value || option.mail) : option;
                  const label = typeof option === 'object' ? option.label : option;
                  const photoPath = typeof option === 'object' ? option.photoPath : null;

                  return (
                    <Box component="li" key={key} {...otherProps} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                      <Avatar
                        src={photoPath}
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: '0.75rem',
                          bgcolor: 'primary.main',
                          color: '#fff'
                        }}
                      >
                        {(label || 'E').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {typeof option === 'object' ? option.name || option.label : option}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {mail}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </BOSFormDialog>

      {/* Email Preview Modal (Strictly Read-Only) */}
      <Dialog
        open={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex' }}>
              <IconEye size={20} />
            </Box>
            <Typography variant="h4" fontWeight={600}>
              Email Preview (OFFER LETTER)
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: 'hidden' }}>
          {emailPreviewData.htmlPreview ? (
            <Box
              sx={{
                maxHeight: '72vh',
                overflowY: 'auto',
                bgcolor: isDark ? 'dark.900' : '#f8fafc',
                p: 2
              }}
              dangerouslySetInnerHTML={{ __html: emailPreviewData.htmlPreview }}
            />
          ) : emailPreviewData.bodyContent ? (
            <Box
              sx={{
                maxHeight: '72vh',
                overflowY: 'auto',
                bgcolor: isDark ? 'dark.900' : '#f8fafc',
                p: 2
              }}
              dangerouslySetInnerHTML={{ __html: emailPreviewData.bodyContent }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => setEmailPreviewOpen(false)}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

SendOfferLetterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  offerLetter: PropTypes.object,
  initialModel: PropTypes.object,
  initialPdfArtifact: PropTypes.object,
  onSuccess: PropTypes.func
};

