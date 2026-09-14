import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Button
} from '@mui/material';
import { IconX, IconPrinter, IconDownload, IconFileTypePdf } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import axios from 'utils/axios';
import { API_PATHS, API_BASE } from 'utils/api-constants';
import Logo from 'ui-component/Logo';

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return format(d, 'dd-MM-yyyy');
  } catch {
    return String(dateVal);
  }
};

export default function AuditObservationPDFDialog({ open, onClose, row, company: propCompany }) {
  const contentRef = useRef(null);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(propCompany || null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `
      @page { size: A4 landscape; margin: 8mm; }
      @media print { 
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
        .pdf-print-container { 
          width: 100% !important; 
          max-width: 100% !important; 
          padding: 0 !important; 
          margin: 0 !important; 
          border: none !important; 
          box-shadow: none !important; 
        } 
        .pdf-no-break {
          page-break-inside: avoid !important;
        }
      }
    `
  });

  const handleDownloadPdf = () => {
    const element = contentRef.current;
    if (!element) return;
    const safeObsNo = (data?.observationNo || row?.observationNo || 'Audit_Report').replace(/[\/\\]/g, '_');
    const opt = {
      margin: [6, 6, 6, 6],
      filename: `Audit_Report_${safeObsNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['tr'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (open) {
      setLoading(true);

      // Fetch employee master list for oldEmpCode mapping
      axios.get('/api/master/hr/employees', { skipGlobalAlert: true })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setEmployees(res.data);
          }
        })
        .catch(() => { });

      // Fetch dynamic company details if not passed as prop
      if (!propCompany) {
        axios.get('/api/company-profile/all')
          .then((res) => {
            let comp = null;
            if (Array.isArray(res.data) && res.data.length > 0) {
              comp = res.data[0];
            } else if (res.data && typeof res.data === 'object') {
              comp = res.data;
            }
            setCompany(comp);
          })
          .catch(() => {
            setCompany(null);
          });
      } else {
        setCompany(propCompany);
      }

      // Fetch observation details
      if (row?.id) {
        axios.get(`${API_PATHS.QMS.AUDIT_OBSERVATION}/${row.id}`)
          .then((res) => {
            setData(res.data);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Failed to fetch full observation details:', err);
            setData(row);
            setLoading(false);
          });
      } else {
        setData(row);
        setLoading(false);
      }
    }
  }, [open, row, propCompany]);

  if (!open || !row) return null;

  // Active dataset
  const activeData = data || row || {};
  const details = activeData?.details || [];

  // Helper functions to resolve oldEmpCode
  const resolveEmpOldCodeFormat = (val, entity) => {
    if (!val && !entity) return '-';
    let rawName = '';
    let rawCode = '';

    if (typeof val === 'string') {
      if (val.startsWith('{') && val.endsWith('}')) {
        try {
          const parsed = JSON.parse(val);
          rawName = parsed.employeeName || parsed.label || parsed.name || '';
          rawCode = parsed.oldEmpCode || parsed.empCode || '';
        } catch (e) { }
      } else if (val.includes(' - ')) {
        const parts = val.split(' - ');
        rawName = parts[0]?.trim();
        rawCode = parts[1]?.trim();
      } else {
        rawName = val.trim();
      }
    } else if (typeof val === 'object' && val !== null) {
      rawName = val.employeeName || val.name || val.label || '';
      rawCode = val.oldEmpCode || val.empCode || '';
    }

    if (entity?.name && !rawName) rawName = entity.name;
    if (entity?.employeeName && !rawName) rawName = entity.employeeName;
    if (entity?.oldEmpCode && !rawCode) rawCode = entity.oldEmpCode;
    if (entity?.empCode && !rawCode) rawCode = entity.empCode;

    let matchedEmp = null;
    if (employees.length > 0) {
      matchedEmp = employees.find((e) => {
        const matchId = entity?.id && String(e.id) === String(entity.id);
        const matchCode = rawCode && (
          String(e.empCode || '').toLowerCase() === String(rawCode).toLowerCase() ||
          String(e.oldEmpCode || '').toLowerCase() === String(rawCode).toLowerCase() ||
          String(e.id || '').toLowerCase() === String(rawCode).toLowerCase()
        );
        const matchName = rawName && (
          String(e.employeeName || '').toLowerCase() === String(rawName).toLowerCase() ||
          String(e.name || '').toLowerCase() === String(rawName).toLowerCase()
        );
        return matchId || matchCode || matchName;
      });
    }

    const finalOldCode = entity?.oldEmpCode || matchedEmp?.oldEmpCode || (rawCode && rawCode.startsWith('NT') ? rawCode : null);
    const finalName = matchedEmp?.employeeName || matchedEmp?.name || entity?.name || rawName;

    if (finalName && finalOldCode) {
      return `${finalName} - ${finalOldCode}`;
    }
    if (finalName && (matchedEmp?.empCode || rawCode)) {
      return `${finalName} - ${matchedEmp?.oldEmpCode || finalOldCode || matchedEmp?.empCode || rawCode}`;
    }
    return val || finalName || '-';
  };

  const resolveEmpOldCodeOnly = (val, entity) => {
    let rawCode = '';
    let rawName = '';

    if (typeof val === 'string') {
      if (val.includes(' - ')) {
        const parts = val.split(' - ');
        rawName = parts[0]?.trim();
        rawCode = parts[1]?.trim();
      } else {
        rawCode = val.trim();
      }
    } else if (typeof val === 'object' && val !== null) {
      rawCode = val.oldEmpCode || val.empCode || '';
      rawName = val.employeeName || val.name || '';
    }

    if (entity?.oldEmpCode) return entity.oldEmpCode;
    if (entity?.empCode && !rawCode) rawCode = entity.empCode;
    if (entity?.name && !rawName) rawName = entity.name;

    if (employees.length > 0) {
      const matchedEmp = employees.find((e) => {
        const matchId = entity?.id && String(e.id) === String(entity.id);
        const matchCode = rawCode && (
          String(e.empCode || '').toLowerCase() === String(rawCode).toLowerCase() ||
          String(e.oldEmpCode || '').toLowerCase() === String(rawCode).toLowerCase() ||
          String(e.id || '').toLowerCase() === String(rawCode).toLowerCase()
        );
        const matchName = rawName && (
          String(e.employeeName || '').toLowerCase() === String(rawName).toLowerCase() ||
          String(e.name || '').toLowerCase() === String(rawName).toLowerCase()
        );
        return matchId || matchCode || matchName;
      });
      if (matchedEmp?.oldEmpCode) return matchedEmp.oldEmpCode;
    }

    return entity?.oldEmpCode || (rawCode && rawCode.startsWith('NT') ? rawCode : '') || rawCode || entity?.empCode || '-';
  };

  const resolveEmpNameOnly = (val, entity) => {
    if (typeof val === 'string' && val.includes(' - ')) {
      return val.split(' - ')[0]?.trim();
    }
    if (entity?.name || entity?.employeeName) {
      return entity.name || entity.employeeName;
    }
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object' && val !== null) {
      return val.employeeName || val.name || '-';
    }
    return String(val || '-');
  };

  // Dynamic Company Details
  const companyName = company?.companyName || company?.name || company?.profileName || 'NUTECH WIND PARTS PVT. LTD';
  const address1 = company?.address || company?.address1 || '2/555A, Babu Jagajeevanram Street';
  const address2 = company?.address2 || '';
  const city = company?.city || 'Gerugambakkam, Chennai';
  const pincode = company?.pincode || company?.postalCode || company?.zipCode || '600122';
  const state = company?.state || 'TAMILNADU';
  const country = company?.country || 'INDIA';
  const phone = company?.phone || company?.mobileNo || company?.phoneNo || company?.contactNo || '91-9840168832, 91-9600949305';
  const gstin = company?.gstin || company?.gstNo || company?.gstNumber || '33AABCN4970C1ZS';
  const email = company?.email || company?.emailId || 'sukierp@sukisoft.com';
  const website = company?.website || company?.webSite || 'https://www.nutechwindparts.com/';

  let logoSrc = null;
  if (company?.logoUrl) {
    logoSrc = company.logoUrl;
  } else if (company?.logo) {
    logoSrc = company.logo;
  } else if (company?.logoName) {
    logoSrc = `${API_BASE}/api/company-profile/image/${company.logoName}`;
  }

  const addressParts = [address1, address2, city ? `${city}${pincode ? ' - ' + pincode : ''}` : pincode, state, country].filter(Boolean);
  const fullAddressStr = addressParts.join(', ');

  // Compute Accurate Counts & Audit Score
  const complianceCount = activeData?.complianceCount != null
    ? Number(activeData.complianceCount)
    : details.filter((d) => (d?.observationStatus || '').toUpperCase() === 'COMPLIANCE').length;

  const ncrCount = activeData?.ncrCount != null
    ? Number(activeData.ncrCount)
    : details.filter((d) => (d?.observationStatus || '').toUpperCase() === 'NCR').length;

  const ofiCount = activeData?.ofiCount != null
    ? Number(activeData.ofiCount)
    : details.filter((d) => (d?.observationStatus || '').toUpperCase() === 'OFI').length;

  const totalValidPoints = complianceCount + ncrCount + ofiCount;
  const totalDetailsCount = details.length;

  let calculatedScorePct = 0;
  if (totalValidPoints > 0) {
    calculatedScorePct = (complianceCount / totalValidPoints) * 100;
  } else if (totalDetailsCount > 0) {
    calculatedScorePct = (complianceCount / totalDetailsCount) * 100;
  } else if (activeData?.auditScore != null) {
    calculatedScorePct = Number(activeData.auditScore);
  }

  const formattedScore = `${Number.isInteger(calculatedScorePct) ? calculatedScorePct : calculatedScorePct.toFixed(1)}%`;

  // Score Color Theme
  let scorePrimaryColor = '#059669'; // Emerald
  let scoreBgColor = '#ecfdf5';
  let scoreBorderColor = '#6ee7b7';
  let scoreLabel = 'EXCELLENT';

  if (calculatedScorePct < 50) {
    scorePrimaryColor = '#dc2626'; // Red
    scoreBgColor = '#fef2f2';
    scoreBorderColor = '#fca5a5';
    scoreLabel = 'CRITICAL / LOW';
  } else if (calculatedScorePct < 80) {
    scorePrimaryColor = '#d97706'; // Amber/Orange
    scoreBgColor = '#fffbeb';
    scoreBorderColor = '#fde68a';
    scoreLabel = 'MODERATE';
  }

  // Auditee & Auditor metadata formatting with oldEmpCode
  const auditeeDisplayName = resolveEmpNameOnly(activeData?.auditee, activeData?.auditeeEntity);
  const auditeeDisplayCode = resolveEmpOldCodeOnly(activeData?.auditee, activeData?.auditeeEntity);
  const auditeeDept = activeData?.auditeeEntity?.department?.name || activeData?.department?.name || activeData?.departmentName || '-';
  const auditeeGrade = activeData?.auditeeEntity?.grade || activeData?.auditeeEntity?.designation?.name || '-';
  const auditorDisplayName = resolveEmpOldCodeFormat(activeData?.auditor, activeData?.auditorEntity);
  const currentStatus = String(activeData?.status || 'OPEN').toUpperCase();

  // Signature displays
  const auditeeSignDisplay = resolveEmpOldCodeFormat(activeData?.auditee, activeData?.auditeeEntity);
  const auditorSignDisplay = resolveEmpOldCodeFormat(activeData?.auditor, activeData?.auditorEntity);
  const approverSignDisplay = resolveEmpOldCodeFormat(activeData?.ncrApprovedBy, activeData?.ncrApprovedByEntity);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          m: 2
        }
      }}
    >
      {/* Dialog Header Actions Bar */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2.5,
          py: 1.5,
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconFileTypePdf size={24} color="#d97706" />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e3a8a', letterSpacing: '0.2px' }}>
            Audit Observation &amp; Score Report Preview
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<IconDownload size={18} />}
            onClick={handleDownloadPdf}
            disabled={loading}
            sx={{ fontWeight: 700, borderRadius: '6px', px: 2 }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<IconPrinter size={18} />}
            onClick={() => reactToPrintFn()}
            disabled={loading}
            sx={{ fontWeight: 700, borderRadius: '6px', px: 2 }}
          >
            Print
          </Button>
          <IconButton onClick={onClose} size="small" title="Close" sx={{ color: '#64748b' }}>
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2, bgcolor: '#ffffff' }}>
        {loading ? (
          <Box sx={{ p: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            ref={contentRef}
            className="pdf-print-container"
            sx={{
              width: '100%',
              bgcolor: '#ffffff',
              fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              color: '#1e293b',
              boxSizing: 'border-box',
              p: 1
            }}
          >
            <style>
              {`
                @media print {
                  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  .pdf-print-container { width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
                  .pdf-no-break { page-break-inside: avoid !important; }
                }
                .pdf-obs-table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
                .pdf-obs-table th, .pdf-obs-table td {
                  border: 1px solid #cbd5e1 !important;
                  word-wrap: break-word !important;
                  word-break: break-word !important;
                  white-space: normal !important;
                }
              `}
            </style>

            {/* 1. TOP COLOR ACCENT BAR */}
            <Box
              sx={{
                height: '5px',
                width: '100%',
                background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 50%, #059669 100%)',
                borderRadius: '3px 3px 0 0',
                mb: 1
              }}
            />

            {/* 2. COMPANY HEADER BLOCK */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1.5px solid #1e3a8a',
                borderRadius: '6px',
                p: 1.5,
                mb: 1,
                bgcolor: '#ffffff'
              }}
            >
              {/* Company Logo */}
              <Box sx={{ width: 170, display: 'flex', justifyContent: 'center', alignItems: 'center', pr: 2, borderRight: '1px solid #e2e8f0' }}>
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Company Logo"
                    style={{ maxWidth: '100%', maxHeight: 75, objectFit: 'contain' }}
                  />
                ) : (
                  <Logo height={65} />
                )}
              </Box>

              {/* Company Information */}
              <Box sx={{ flex: 1, pl: 2.5, textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '17px',
                    color: '#1e3a8a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    mb: 0.3
                  }}
                >
                  {companyName}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#334155', fontWeight: 500, mb: 0.3, lineHeight: 1.3 }}>
                  {fullAddressStr}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mb: 0.3 }}>
                  {gstin && (
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: '#eff6ff',
                        color: '#1e40af',
                        px: 1,
                        py: 0.2,
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe',
                        fontSize: '10.5px',
                        fontWeight: 700
                      }}
                    >
                      GSTIN: {gstin}
                    </Box>
                  )}
                  {phone && (
                    <Typography sx={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>
                      Phone: {phone}
                    </Typography>
                  )}
                </Stack>
                <Typography sx={{ fontSize: '10px', color: '#64748b' }}>
                  Email: <span style={{ color: '#2563eb', fontWeight: 600 }}>{email}</span> | Website:{' '}
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>{website}</span>
                </Typography>
              </Box>

              {/* Header Status & Code Pill */}
              <Box sx={{ pr: 1.5, textAlign: 'right', minWidth: 130 }}>
                <Typography sx={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Report Status
                </Typography>
                <Box
                  sx={{
                    mt: 0.4,
                    display: 'inline-block',
                    px: 1.5,
                    py: 0.4,
                    borderRadius: '12px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    bgcolor: currentStatus === 'CLOSED' ? '#dcfce7' : '#fef3c7',
                    color: currentStatus === 'CLOSED' ? '#15803d' : '#b45309',
                    border: `1px solid ${currentStatus === 'CLOSED' ? '#86efac' : '#fcd34d'}`
                  }}
                >
                  {currentStatus}
                </Box>
              </Box>
            </Box>

            {/* 3. REPORT TITLE BANNER */}
            <Box
              sx={{
                background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)',
                color: '#ffffff',
                py: 0.8,
                px: 2,
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '13.5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                AUDIT OBSERVATION &amp; PERFORMANCE REPORT
              </Typography>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, opacity: 0.9 }}>
                Generated on: {format(new Date(), 'dd-MM-yyyy HH:mm')}
              </Typography>
            </Box>

            {/* 4. AUDIT OVERVIEW & EXECUTIVE SCORE SECTION (2-Column Dashboard) */}
            <Box sx={{ display: 'flex', gap: 1.2, mb: 1.2, alignItems: 'stretch' }}>
              {/* Left Card: Audit Information Table (63%) */}
              <Box
                sx={{
                  flex: '1 1 63%',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  bgcolor: '#ffffff'
                }}
              >
                <Box sx={{ bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderBottom: '1px solid #cbd5e1', borderRadius: '5px 5px 0 0' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '11px', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Audit Details &amp; Auditee Profile
                  </Typography>
                </Box>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '22%', padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Observation No</td>
                      <td style={{ width: '28%', padding: '5px 8px', color: '#0f172a', fontWeight: 700, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{activeData?.observationNo || '-'}</td>
                      <td style={{ width: '22%', padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Auditee Name</td>
                      <td style={{ width: '28%', padding: '5px 8px', color: '#0f172a', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>{auditeeDisplayName}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Observation Date</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{formatDisplayDate(activeData?.observationDate)}</td>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Auditee Code</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{auditeeDisplayCode}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Schedule No</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', fontWeight: 600, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{activeData?.auditScheduleNo || '-'}</td>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Department</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>{auditeeDept}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Schedule Date</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>{formatDisplayDate(activeData?.auditScheduleDate || activeData?.createdDate)}</td>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>Designation / Level</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', borderBottom: '1px solid #e2e8f0' }}>{auditeeGrade}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderRight: '1px solid #e2e8f0' }}>Audit Type</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          {activeData?.auditTypeEntity?.name || activeData?.auditType || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', bgcolor: '#f8fafc', fontWeight: 700, color: '#334155', borderRight: '1px solid #e2e8f0' }}>Auditor Name</td>
                      <td style={{ padding: '5px 8px', color: '#0f172a', fontWeight: 600 }}>{auditorDisplayName}</td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              {/* Right Card: Vibrant Audit Score & Breakdown Card (37%) */}
              <Box
                sx={{
                  flex: '1 1 37%',
                  border: `2px solid ${scoreBorderColor}`,
                  borderRadius: '6px',
                  bgcolor: scoreBgColor,
                  p: 1.2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ textAlign: 'center', pb: 0.5, borderBottom: `1px solid ${scoreBorderColor}` }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '11px', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    AUDIT PERFORMANCE SCORE
                  </Typography>
                </Box>

                {/* Prominent Score Gauge Banner */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 0.8 }}>
                  <Box
                    sx={{
                      bgcolor: '#ffffff',
                      border: `2.5px solid ${scorePrimaryColor}`,
                      borderRadius: '8px',
                      px: 2,
                      py: 0.4,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 900,
                        color: scorePrimaryColor,
                        lineHeight: 1.1,
                        fontFamily: 'inherit'
                      }}
                    >
                      {formattedScore}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography
                      sx={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: scorePrimaryColor,
                        letterSpacing: '0.5px'
                      }}
                    >
                      {scoreLabel}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
                      {complianceCount} / {totalValidPoints > 0 ? totalValidPoints : totalDetailsCount} Points
                    </Typography>
                  </Box>
                </Box>

                {/* Colorful Metric Pill Badges */}
                <Box sx={{ display: 'flex', gap: '6px', mt: 0.5, width: '100%' }}>
                  <Box sx={{ flex: 1, bgcolor: '#ffffff', border: '1px solid #86efac', borderRadius: '4px', p: 0.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Compliance</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 900, color: '#16a34a' }}>{complianceCount}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, bgcolor: '#ffffff', border: '1px solid #fca5a5', borderRadius: '4px', p: 0.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>NCR</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 900, color: '#dc2626' }}>{ncrCount}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, bgcolor: '#ffffff', border: '1px solid #fcd34d', borderRadius: '4px', p: 0.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>OFI</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 900, color: '#d97706' }}>{ofiCount}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, bgcolor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', p: 0.5, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Total</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{totalValidPoints}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* 5. CRITERIA DETAILS TABLE */}
            <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '6px', mb: 1.5 }}>
              <table className="pdf-obs-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: '#ffffff' }}>
                    <th style={{ padding: '6px 4px', textAlign: 'center', width: '4%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>S.No</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', width: '6%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Seq No</th>
                    <th style={{ padding: '6px 6px', textAlign: 'left', width: '10%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Clause</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '38%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Checklist Criteria</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', width: '8%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Attachment</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', width: '11%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Observation Status</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', width: '11%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Approval Status</th>
                    <th style={{ padding: '6px 6px', textAlign: 'left', width: '12%', fontWeight: 800, color: '#ffffff', border: '1px solid #1e3a8a' }}>Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => {
                    const obsStatus = (detail?.observationStatus || 'NO ENTRY').toUpperCase();
                    const appStatus = (detail?.approvalStatus || 'NOT APPLICABLE').toUpperCase();
                    const hasAttachment = detail?.attachmentPath || detail?.isFileUploaded || detail?.attachmentReq === 'YES' || detail?.attachmentReq === true;

                    // Status Badge Colors
                    let obsBg = '#f1f5f9';
                    let obsColor = '#475569';
                    let obsBorder = '#cbd5e1';

                    if (obsStatus === 'COMPLIANCE') {
                      obsBg = '#dcfce7';
                      obsColor = '#15803d';
                      obsBorder = '#86efac';
                    } else if (obsStatus === 'NCR') {
                      obsBg = '#fee2e2';
                      obsColor = '#b91c1c';
                      obsBorder = '#fca5a5';
                    } else if (obsStatus === 'OFI') {
                      obsBg = '#fef3c7';
                      obsColor = '#b45309';
                      obsBorder = '#fcd34d';
                    }

                    // Approval Badge Colors
                    let appBg = '#f3f4f6';
                    let appColor = '#4b5563';
                    let appBorder = '#d1d5db';

                    if (appStatus === 'APPROVED') {
                      appBg = '#d1fae5';
                      appColor = '#065f46';
                      appBorder = '#6ee7b7';
                    } else if (appStatus === 'REJECTED') {
                      appBg = '#ffe4e6';
                      appColor = '#9f1239';
                      appBorder = '#fda4af';
                    } else if (appStatus === 'PENDING') {
                      appBg = '#fef3c7';
                      appColor = '#92400e';
                      appBorder = '#fde68a';
                    }

                    return (
                      <tr
                        key={index}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                        }}
                      >
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, color: '#475569' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 700, color: '#1e3a8a' }}>
                          {detail?.checklist?.seqNo || detail?.seqNo || '-'}
                        </td>
                        <td style={{ padding: '6px 6px', fontWeight: 600, color: '#334155' }}>
                          {detail?.checklist?.clause || detail?.clause || '-'}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#0f172a', lineHeight: 1.35, fontWeight: 500 }}>
                          {detail?.checklist?.description || detail?.criteriaDetails || '-'}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: 800,
                              backgroundColor: hasAttachment ? '#dbeafe' : '#f3f4f6',
                              color: hasAttachment ? '#1e40af' : '#64748b',
                              border: `1px solid ${hasAttachment ? '#93c5fd' : '#e2e8f0'}`
                            }}
                          >
                            {hasAttachment ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 7px',
                              borderRadius: '12px',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              letterSpacing: '0.3px',
                              textTransform: 'uppercase',
                              backgroundColor: obsBg,
                              color: obsColor,
                              border: `1px solid ${obsBorder}`
                            }}
                          >
                            {obsStatus}
                          </span>
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 7px',
                              borderRadius: '12px',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              letterSpacing: '0.3px',
                              textTransform: 'uppercase',
                              backgroundColor: appBg,
                              color: appColor,
                              border: `1px solid ${appBorder}`
                            }}
                          >
                            {appStatus}
                          </span>
                        </td>
                        <td style={{ padding: '6px 6px', color: '#334155', fontStyle: detail?.comments ? 'normal' : 'italic', fontSize: '9.5px' }}>
                          {detail?.comments || 'No comments recorded'}
                        </td>
                      </tr>
                    );
                  })}

                  {details.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                        No checklist criteria details found for this audit observation.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>

            {/* 6. SIGNATURE & AUTHORIZATION SECTION */}
            <Box
              className="pdf-no-break"
              sx={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                bgcolor: '#ffffff',
                p: 1.5,
                mb: 1.2
              }}
            >
              <Typography sx={{ fontSize: '10.5px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', mb: 1, letterSpacing: '0.5px' }}>
                VERIFICATION &amp; AUTHORIZATION SIGN-OFF
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                {/* Auditee Signature */}
                <Box sx={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', p: 1, bgcolor: '#f8fafc' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>Auditee Sign-off:</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', mt: 0.3 }}>
                    {auditeeSignDisplay}
                  </Typography>
                  <Box sx={{ mt: 3, pt: 0.5, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                    <span>Signature</span>
                    <span>Date: {formatDisplayDate(activeData?.observationDate)}</span>
                  </Box>
                </Box>

                {/* Auditor Signature */}
                <Box sx={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', p: 1, bgcolor: '#f8fafc' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>Auditor Sign-off:</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', mt: 0.3 }}>
                    {auditorSignDisplay}
                  </Typography>
                  <Box sx={{ mt: 3, pt: 0.5, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                    <span>Signature</span>
                    <span>Date: {formatDisplayDate(activeData?.auditActualDate || activeData?.observationDate)}</span>
                  </Box>
                </Box>

                {/* Approved By / MR Signature */}
                <Box sx={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '4px', p: 1, bgcolor: '#f8fafc' }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>Approved By (HOD / MR):</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', mt: 0.3 }}>
                    {approverSignDisplay}
                  </Typography>
                  <Box sx={{ mt: 3, pt: 0.5, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                    <span>Authorized Signatory</span>
                    <span>Date: {formatDisplayDate(new Date())}</span>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* 7. SYSTEM FOOTER */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px',
                color: '#94a3b8',
                pt: 0.5,
                borderTop: '1px solid #e2e8f0'
              }}
            >
              <span>Autonoma BOS(S) - Quality Management System (QMS Audit Observation)</span>
              <span>Confidential - For Internal QMS Audit Reference Only</span>
              <span>Doc: {activeData?.observationNo || 'QMS-OBR'}</span>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
