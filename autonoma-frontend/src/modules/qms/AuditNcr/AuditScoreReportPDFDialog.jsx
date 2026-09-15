import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { API_BASE } from 'utils/api-constants';
import Logo from 'ui-component/Logo';
import { btnCancel } from 'ui-component/bos';

const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return String(dateVal);
  }
};

export default function AuditScoreReportPDFDialog({
  open,
  onClose,
  viewTab,
  displayMode = 'cards',
  filteredRows = [],
  departmentSummary = [],
  auditTypeSummary = [],
  metrics = {},
  filters = {}
}) {
  const contentRef = useRef(null);
  const [company, setCompany] = useState(null);
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
      }
    `
  });

  const handleDownloadPdf = () => {
    const element = contentRef.current;
    if (!element) return;
    const title =
      viewTab === 1
        ? 'Department_Audit_Score_Summary'
        : viewTab === 2
        ? 'Audit_Type_Score_Summary'
        : 'Audit_Score_Detailed_Report';
    const opt = {
      margin: [6, 6, 6, 6],
      filename: `${title}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios
        .get('/api/company-profile/all')
        .then((res) => {
          let comp = null;
          if (Array.isArray(res.data) && res.data.length > 0) {
            comp = res.data[0];
          } else if (res.data && typeof res.data === 'object') {
            comp = res.data;
          }
          setCompany(comp);
          setLoading(false);
        })
        .catch(() => {
          setCompany(null);
          setLoading(false);
        });
    }
  }, [open]);

  if (!open) return null;

  // Dynamic Company Details
  const companyName = company?.companyName || company?.name || company?.profileName || 'AUTONOVA';
  const address1 = company?.address || company?.address1 || '2/555A, Babu Jagajeevanram Street';
  const address2 = company?.address2 || '';
  const city = company?.city || 'Gerugambakkam, Chennai';
  const pincode = company?.pincode || company?.postalCode || company?.zipCode || '600122';
  const state = company?.state || 'TAMILNADU';
  const country = company?.country || 'INDIA';
  const phone = company?.phone || company?.mobileNo || company?.phoneNo || '91-9840168832';
  const gstin = company?.gstin || company?.gstNo || company?.gstNumber || '33AABCN4970C1ZS';
  const email = company?.email || company?.emailId || 'info@autonova.com';
  const website = company?.website || company?.webSite || 'www.autonova.com';

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

  const contactLineParts = [
    phone ? `Mob: ${phone}` : '',
    email ? `Email: ${email}` : '',
    website ? `Web: ${website}` : ''
  ].filter(Boolean);
  const contactLineStr = contactLineParts.join(' | ');

  const reportTitle =
    viewTab === 1
      ? 'DEPARTMENT AUDIT SCORE PERFORMANCE SUMMARY REPORT'
      : viewTab === 2
      ? 'AUDIT TYPE SCORE PERFORMANCE SUMMARY REPORT'
      : 'AUDIT OBSERVATIONS & FINDINGS SCORE REPORT';

  const dateFilterStr =
    filters.observationDateStart && filters.observationDateEnd
      ? `${formatDisplayDate(filters.observationDateStart)} to ${formatDisplayDate(filters.observationDateEnd)}`
      : 'All Available Dates';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Dialog Header Bar */}
      <DialogTitle
        sx={{
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          py: 1.8,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconFileTypePdf size={26} color="#d32f2f" />
          <Typography variant="h4" component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Audit Score Report PDF Preview ({displayMode === 'cards' ? 'Card View' : 'Table View'})
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            size="small"
            startIcon={<IconDownload size={18} />}
            onClick={handleDownloadPdf}
            disabled={loading}
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
          >
            Print
          </Button>
          <IconButton onClick={onClose} size="small" title="Close" sx={{ ml: 1 }}>
            <IconX size={22} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f1f5f9' }}>
        {loading ? (
          <Box sx={{ p: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <Box
              ref={contentRef}
              className="pdf-print-container"
              sx={{
                width: '280mm',
                minHeight: '195mm',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #cbd5e1',
                fontFamily: '"Times New Roman", Times, serif',
                color: '#000000',
                p: '8mm',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              {/* 1. COMPANY HEADER (Rule 33) */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1.5px solid #000',
                  p: 1.5,
                  mb: 0
                }}
              >
                <Box sx={{ width: 140, display: 'flex', justifyContent: 'center', alignItems: 'center', pr: 1.5 }}>
                  {logoSrc ? (
                    <img src={logoSrc} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: 75, objectFit: 'contain' }} />
                  ) : (
                    <Logo height={65} />
                  )}
                </Box>
                <Box sx={{ flex: 1, textAlign: 'left', pl: 1 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase', color: '#000', fontFamily: 'inherit', mb: 0.2 }}>
                    {companyName}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#000', fontFamily: 'inherit', mb: 0.2 }}>
                    {fullAddressStr}
                  </Typography>
                  {gstin && (
                    <Typography sx={{ fontSize: '11px', fontWeight: 'bold', color: '#000', fontFamily: 'inherit', mb: 0.2 }}>
                      GSTIN : {gstin}
                    </Typography>
                  )}
                  {contactLineStr && (
                    <Typography sx={{ fontSize: '10.5px', color: '#333', fontFamily: 'inherit' }}>
                      {contactLineStr}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* 2. REPORT NAME (Snug below Company Header, bold, uppercase, centered, underlined) */}
              <Box
                sx={{
                  textAlign: 'center',
                  borderLeft: '1.5px solid #000',
                  borderRight: '1.5px solid #000',
                  borderBottom: '1.5px solid #000',
                  py: 0.8,
                  bgcolor: '#f8fafc'
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '13.5px',
                    textTransform: 'uppercase',
                    textDecoration: 'underline',
                    color: '#000',
                    fontFamily: 'inherit',
                    letterSpacing: '0.5px'
                  }}
                >
                  {reportTitle}
                </Typography>
              </Box>

              {/* 3. DOCUMENT DETAILS BLOCK */}
              <Box
                sx={{
                  borderLeft: '1.5px solid #000',
                  borderRight: '1.5px solid #000',
                  borderBottom: '1.5px solid #000',
                  p: 1.2,
                  bgcolor: '#ffffff',
                  mb: 1.5
                }}
              >
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '11px', mb: 0.4 }}>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>
                    <b>DOC. No : </b> QMS/ASR/{format(new Date(), 'yyyyMMdd/HHmm')}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>
                    <b>Report Date : </b> {formatDisplayDate(new Date())}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>
                    <b>Scope : </b> {filters.taskScope || 'Company'}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: '11px' }}>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>
                    <b>Date Filter : </b> {dateFilterStr}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'inherit' }}>
                    <b>Total Audits : </b> {filteredRows.length}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', fontFamily: 'inherit', color: '#1565c0' }}>
                    <b>Overall Avg Score : </b> <b>{metrics.avgScore || 0} / 10</b>
                  </Typography>
                </Stack>
              </Box>

              {/* 4. DATA DISPLAY: CLEAN HIGH-RES CARDS GRID OR TABLE VIEW */}

              {/* A. DEPARTMENT SCORE CARDS GRID (When in Card View) */}
              {viewTab === 1 && displayMode === 'cards' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {departmentSummary.map((d, idx) => {
                    const scoreNum = Number(d.avgScore) || 0;
                    const starValue = Number(Math.min(5, Math.max(0, scoreNum / 2)).toFixed(1));
                    const pct = Math.min(100, Math.max(0, Math.round(scoreNum <= 10 ? scoreNum * 10 : scoreNum)));
                    const themeColor = d.departmentName.toUpperCase().includes('PLANNING') ? '#059669' :
                      d.departmentName.toUpperCase().includes('STORE') ? '#d97706' :
                      d.departmentName.toUpperCase().includes('HRA') ? '#7c3aed' :
                      d.departmentName.toUpperCase().includes('PROD') ? '#0284c7' : '#e11d48';

                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '14px',
                          backgroundColor: '#ffffff',
                          padding: '12px',
                          boxSizing: 'border-box',
                          pageBreakInside: 'avoid',
                          borderTop: `4px solid ${themeColor}`
                        }}
                      >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', textTransform: 'uppercase' }}>
                              {d.departmentName}
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>
                              {d.scheduleCount || 1} Schedule{(d.scheduleCount || 1) > 1 ? 's' : ''} • {d.count} Audits
                            </div>
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: d.grade === 'Excellent' ? '#ecfdf5' : '#fef8e7',
                            color: d.grade === 'Excellent' ? '#059669' : '#d97706',
                            border: `1px solid ${d.grade === 'Excellent' ? '#a7f3d0' : '#fde68a'}`
                          }}>
                            {d.grade}
                          </span>
                        </div>

                        {/* Hero Score Box */}
                        <div style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px'
                        }}>
                          <div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold', color: themeColor, textTransform: 'uppercase' }}>
                              AUDIT SCORE
                            </div>
                            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', marginTop: '2px' }}>
                              {'★'.repeat(Math.floor(starValue)) + '☆'.repeat(5 - Math.floor(starValue))} <span style={{ color: '#d97706', fontSize: '10px' }}>{starValue}/5</span>
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: themeColor,
                            color: '#ffffff',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            textAlign: 'center'
                          }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: 1 }}>{d.avgScore}</div>
                            <div style={{ fontSize: '8px', fontWeight: 'bold', opacity: 0.9 }}>SCORE</div>
                          </div>
                        </div>

                        {/* 3 Metric Tiles */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                          <div style={{ textAlign: 'center', backgroundColor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '8px', padding: '4px' }}>
                            <div style={{ fontSize: '9px', color: '#15803d', fontWeight: 'bold' }}>Comp</div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#16a34a' }}>{d.avgCompliance}</div>
                          </div>
                          <div style={{ textAlign: 'center', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '4px' }}>
                            <div style={{ fontSize: '9px', color: '#b45309', fontWeight: 'bold' }}>OFI</div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#d97706' }}>{d.avgOfi}</div>
                          </div>
                          <div style={{ textAlign: 'center', backgroundColor: d.totalNcr > 0 ? '#fef2f2' : '#f8fafc', border: `1px solid ${d.totalNcr > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: '8px', padding: '4px' }}>
                            <div style={{ fontSize: '9px', color: d.totalNcr > 0 ? '#b91c1c' : '#64748b', fontWeight: 'bold' }}>Total NC</div>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: d.totalNcr > 0 ? '#dc2626' : '#0f172a' }}>{d.totalNcr}</div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: themeColor, borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: themeColor }}>{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* B. AUDIT TYPE SCORE CARDS GRID (When in Card View) */}
              {viewTab === 2 && displayMode === 'cards' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  {auditTypeSummary.map((t, idx) => {
                    const scoreNum = Number(t.avgScore) || 0;
                    const starValue = Number(Math.min(5, Math.max(0, scoreNum / 2)).toFixed(1));
                    const pct = Math.min(100, Math.max(0, Math.round(scoreNum <= 10 ? scoreNum * 10 : scoreNum)));
                    const themeColor = t.auditType.toUpperCase().includes('STOCK') ? '#d97706' :
                      t.auditType.toUpperCase().includes('ISO') ? '#059669' :
                      t.auditType.toUpperCase().includes('5S') ? '#7c3aed' : '#2563eb';

                    return (
                      <div
                        key={idx}
                        style={{
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '14px',
                          backgroundColor: '#ffffff',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          pageBreakInside: 'avoid'
                        }}
                      >
                        {/* Gradient Banner Top */}
                        <div style={{ backgroundColor: themeColor, color: '#ffffff', padding: '10px 12px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '12.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                            {t.auditType}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '9px', fontWeight: 'bold' }}>
                            <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '6px' }}>
                              {t.departmentCount || 1} Depts
                            </span>
                            <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '6px' }}>
                              {t.scheduleCount || 1} Sched
                            </span>
                            <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '6px' }}>
                              {t.count} Audits
                            </span>
                          </div>
                        </div>

                        <div style={{ padding: '10px 12px' }}>
                          {/* Score Showcase */}
                          <div style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '8px',
                            textAlign: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: themeColor, lineHeight: 1 }}>
                              {t.avgScore} <span style={{ fontSize: '10px', color: '#64748b' }}>/ 10</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 'bold', marginTop: '2px' }}>
                              {'★'.repeat(Math.floor(starValue)) + '☆'.repeat(5 - Math.floor(starValue))} <span style={{ color: '#d97706' }}>{starValue}/5</span>
                            </div>
                          </div>

                          {/* Department Tags */}
                          {t.departmentsList && t.departmentsList.length > 0 && (
                            <div style={{ fontSize: '9px', color: '#475569', marginBottom: '8px' }}>
                              <b>Depts: </b> {t.departmentsList.join(', ')}
                            </div>
                          )}

                          {/* 3 Metrics Strip */}
                          <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{ flex: 1, padding: '4px', textAlign: 'center', borderRight: '1px solid #e2e8f0', backgroundColor: '#f0fdf4' }}>
                              <div style={{ fontSize: '8.5px', color: '#15803d', fontWeight: 'bold' }}>Comp</div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>{t.avgCompliance}</div>
                            </div>
                            <div style={{ flex: 1, padding: '4px', textAlign: 'center', borderRight: '1px solid #e2e8f0', backgroundColor: '#fffbeb' }}>
                              <div style={{ fontSize: '8.5px', color: '#b45309', fontWeight: 'bold' }}>OFI</div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#d97706' }}>{t.avgOfi}</div>
                            </div>
                            <div style={{ flex: 1, padding: '4px', textAlign: 'center', backgroundColor: t.totalNcr > 0 ? '#fef2f2' : '#f8fafc' }}>
                              <div style={{ fontSize: '8.5px', color: t.totalNcr > 0 ? '#b91c1c' : '#64748b', fontWeight: 'bold' }}>NC</div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: t.totalNcr > 0 ? '#dc2626' : '#0f172a' }}>{t.totalNcr}</div>
                            </div>
                          </div>

                          {/* Progress */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: themeColor, borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: themeColor }}>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* C. TABLE VIEW FOR TABLES / DETAILED LIST */}
              {((viewTab === 1 && displayMode === 'table') || (viewTab === 2 && displayMode === 'table') || viewTab === 0) && (
                <Box className="pdf-table-container" sx={{ mb: 2 }}>
                  {viewTab === 1 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>#</th>
                          <th style={{ textAlign: 'left', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Department Name</th>
                          <th style={{ width: '80px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Schedules</th>
                          <th style={{ width: '80px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Total Audits</th>
                          <th style={{ width: '90px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Avg Comp</th>
                          <th style={{ width: '70px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Avg OFI</th>
                          <th style={{ width: '70px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Avg NCR</th>
                          <th style={{ width: '75px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Total NCR</th>
                          <th style={{ width: '100px', border: '1px solid #000', padding: '6px', backgroundColor: '#cbd5e1' }}>AVG SCORE</th>
                          <th style={{ width: '100px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentSummary.map((d, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '4px' }}>{d.departmentName}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{d.scheduleCount || 1}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{d.count}</td>
                            <td style={{ textAlign: 'center', color: '#15803d', fontWeight: 'bold', border: '1px solid #000', padding: '4px' }}>{d.avgCompliance}</td>
                            <td style={{ textAlign: 'center', color: '#b45309', border: '1px solid #000', padding: '4px' }}>{d.avgOfi}</td>
                            <td style={{ textAlign: 'center', color: '#b91c1c', border: '1px solid #000', padding: '4px' }}>{d.avgNcr}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: d.totalNcr > 0 ? '#dc2626' : '#000', border: '1px solid #000', padding: '4px' }}>{d.totalNcr}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', backgroundColor: '#f1f5f9', border: '1px solid #000', padding: '4px' }}>{d.avgScore}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', border: '1px solid #000', padding: '4px' }}>{d.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {viewTab === 2 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>#</th>
                          <th style={{ textAlign: 'left', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Audit Type</th>
                          <th style={{ textAlign: 'left', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Included Departments</th>
                          <th style={{ width: '75px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Schedules</th>
                          <th style={{ width: '75px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Total Audits</th>
                          <th style={{ width: '85px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Avg Comp</th>
                          <th style={{ width: '70px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Avg OFI</th>
                          <th style={{ width: '70px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Avg NCR</th>
                          <th style={{ width: '75px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Total NCR</th>
                          <th style={{ width: '95px', border: '1px solid #000', padding: '6px', backgroundColor: '#cbd5e1' }}>AVG SCORE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditTypeSummary.map((t, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '4px' }}>{t.auditType}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{t.departmentsList ? t.departmentsList.join(', ') : '-'}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{t.scheduleCount || 1}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{t.count}</td>
                            <td style={{ textAlign: 'center', color: '#15803d', fontWeight: 'bold', border: '1px solid #000', padding: '4px' }}>{t.avgCompliance}</td>
                            <td style={{ textAlign: 'center', color: '#b45309', border: '1px solid #000', padding: '4px' }}>{t.avgOfi}</td>
                            <td style={{ textAlign: 'center', color: '#b91c1c', border: '1px solid #000', padding: '4px' }}>{t.avgNcr}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: t.totalNcr > 0 ? '#dc2626' : '#000', border: '1px solid #000', padding: '4px' }}>{t.totalNcr}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', backgroundColor: '#f1f5f9', border: '1px solid #000', padding: '4px' }}>{t.avgScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {viewTab === 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '35px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>#</th>
                          <th style={{ width: '90px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Obs No</th>
                          <th style={{ width: '70px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Date</th>
                          <th style={{ width: '85px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Schedule No</th>
                          <th style={{ textAlign: 'left', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Audit Type</th>
                          <th style={{ textAlign: 'left', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Department</th>
                          <th style={{ textAlign: 'left', width: '90px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Auditee</th>
                          <th style={{ textAlign: 'left', width: '90px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Auditor</th>
                          <th style={{ width: '50px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Comp</th>
                          <th style={{ width: '45px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>NC</th>
                          <th style={{ width: '45px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>OFI</th>
                          <th style={{ width: '55px', border: '1px solid #000', padding: '6px', backgroundColor: '#cbd5e1' }}>Score</th>
                          <th style={{ width: '65px', border: '1px solid #000', padding: '6px', backgroundColor: '#e2e8f0' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((r, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 'bold', border: '1px solid #000', padding: '4px' }}>{r.observationNo}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{formatDisplayDate(r.observationDate)}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{r.auditScheduleNo || '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{r.auditType || '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{r.departmentName || '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{r.auditee ? String(r.auditee).split(' - ')[0] : '-'}</td>
                            <td style={{ border: '1px solid #000', padding: '4px' }}>{r.auditor ? String(r.auditor).split(' - ')[0] : '-'}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{r.complianceCount || 0}</td>
                            <td style={{ textAlign: 'center', color: (r.ncrCount || 0) > 0 ? '#dc2626' : '#000', fontWeight: (r.ncrCount || 0) > 0 ? 'bold' : 'normal', border: '1px solid #000', padding: '4px' }}>
                              {r.ncrCount || 0}
                            </td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{r.ofiCount || 0}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11.5px', border: '1px solid #000', padding: '4px' }}>{r.auditScore || 0}</td>
                            <td style={{ textAlign: 'center', border: '1px solid #000', padding: '4px' }}>{String(r.status || 'OPEN').toUpperCase()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Box>
              )}

              {/* 5. SIGNATURES (Rule 33) */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #000', position: 'relative' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ pt: 3 }}>
                  <Box sx={{ textAlign: 'center', width: 200 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'inherit', borderTop: '1px solid #000', pt: 0.5 }}>
                      Prepared By
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit', mt: 0.2 }}>
                      Quality Auditor / Lead
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', width: 200 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'inherit', borderTop: '1px solid #000', pt: 0.5 }}>
                      Verified By
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: '#555', fontFamily: 'inherit', mt: 0.2 }}>
                      Head - Quality Assurance (QA)
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button {...btnCancel} onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
