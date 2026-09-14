import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, IconButton, Stack, Typography, CircularProgress, Button, Chip, Grid } from '@mui/material';
import { IconX, IconPrinter, IconDownload, IconFileTypePdf } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import axios from 'utils/axios';
import { API_PATHS, API_BASE } from 'utils/api-constants';
import Logo from 'ui-component/Logo';
import { btnSave, btnCancel, btnClear } from 'ui-component/bos';

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

const formatNameOnly = (val) => {
  if (!val) return '-';
  if (typeof val === 'string') {
    if (val.startsWith('{') && val.endsWith('}')) {
      try {
        const parsed = JSON.parse(val);
        return parsed.employeeName || parsed.label || parsed.name || val;
      } catch (e) {}
    }
    if (val.includes(' - ')) {
      return val.split(' - ')[0].trim();
    }
    return val;
  }
  if (typeof val === 'object' && val !== null) {
    return val.employeeName || val.name || val.label || val.id || '-';
  }
  return String(val) || '-';
};

export default function AuditSchedulePDFDialog({ open, onClose, row }) {
  const contentRef = useRef(null);
  const [data, setData] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `
      @page { size: A4 portrait; margin: 8mm; }
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
    const safeNo = (data?.scheduleNo || row?.scheduleNo || 'Audit_Schedule').replace(/[\/\\]/g, '_');
    const opt = {
      margin: [6, 6, 6, 6],
      filename: `Audit_Schedule_${safeNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (open) {
      setLoading(true);

      // Fetch dynamic company profile (no hardcoded fallback values)
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

      if (row?.id) {
        axios.get(`${API_PATHS.QMS.AUDIT_SCHEDULE}/${row.id}`)
          .then((res) => {
            setData(res.data);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Failed to fetch full audit schedule details for PDF:', err);
            setData(row);
            setLoading(false);
          });
      } else {
        setData(row);
        setLoading(false);
      }
    }
  }, [open, row]);

  if (!open || !row) return null;

  const activeRowData = data || row || {};
  const criteriaList = activeRowData?.criteriaList || activeRowData?.criteria || row?.criteriaList || [];

  // Summary box variables (Matching existing page Cancel Dialog style exactly)
  const displayScheduleNo = activeRowData.scheduleNo || row?.scheduleNo || (activeRowData.id || row?.id ? `AD-26-${String(activeRowData.id || row?.id).padStart(4, '0')}` : '-');
  const displayStatus = activeRowData.status || row?.status || 'OPEN';
  const displayAuditType = activeRowData.auditType || activeRowData.auditTypeEntity?.name || row?.auditType || '-';
  const displayDepartment = activeRowData.department || activeRowData.departmentEntity?.departmentName || row?.department || '-';
  const displayAuditDate = formatDisplayDate(activeRowData.auditDate || activeRowData.scheduleDate || row?.auditDate || row?.scheduleDate);
  const displayAuditee = formatNameOnly(activeRowData.auditee || activeRowData.auditeeEntity || row?.auditee);
  const displayAuditor = formatNameOnly(activeRowData.auditor || activeRowData.auditorEntity || row?.auditor);

  // Dynamic Company Details (Zero hardcoding)
  const companyName = company?.companyName || company?.name || company?.profileName || '';
  const address1 = company?.address || company?.address1 || '';
  const address2 = company?.address2 || '';
  const city = company?.city || '';
  const pincode = company?.pincode || company?.postalCode || company?.zipCode || '';
  const state = company?.state || '';
  const country = company?.country || '';
  const phone = company?.phone || company?.mobileNo || company?.phoneNo || company?.contactNo || '';
  const gstin = company?.gstin || company?.gstNo || company?.gstNumber || '';
  const email = company?.email || company?.emailId || '';
  const website = company?.website || company?.webSite || '';

  // Determine Logo Image URL
  let logoSrc = null;
  if (company?.logoUrl) {
    logoSrc = company.logoUrl;
  } else if (company?.logo) {
    logoSrc = company.logo;
  } else if (company?.logoName) {
    logoSrc = `${API_BASE}/api/company-profile/image/${company.logoName}`;
  }

  // Address lines composition
  const addressParts = [address1, address2, city ? `${city}${pincode ? ' ,' + pincode : ''}` : pincode].filter(Boolean);
  const fullAddressStr = addressParts.join(', ');

  const locationParts = [state, country].filter(Boolean);
  const stateCountryStr = locationParts.join(', ');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Dialog Header Bar with X button aligned to far right */}
      <DialogTitle
        sx={{
          bgcolor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          py: 2,
          px: 3,
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconFileTypePdf size={26} color="#d32f2f" />
          <Typography variant="h4" component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Audit Schedule Report PDF Preview
          </Typography>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          title="Close"
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
          }}
        >
          <IconX size={22} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>
        {/* Existing Page Dialog Styled Card Summary Header */}
        <Box sx={{ p: 2, mb: 2.5, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.05rem' }}>
              {displayScheduleNo}
            </Typography>
            <Chip
              label={displayStatus}
              size="small"
              color={
                displayStatus === 'CLOSED' ? 'success' :
                displayStatus === 'CANCELLED' ? 'error' :
                displayStatus === 'RESCHEDULE' ? 'warning' : 'info'
              }
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" display="block">Audit Type</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayAuditType}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" display="block">Department</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayDepartment}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" display="block">Audit Date</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayAuditDate}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary" display="block">Auditee / Auditor</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayAuditee} / {displayAuditor}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Printable Document Preview Area */}
        {loading ? (
          <Box sx={{ p: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', bgcolor: '#f1f5f9', p: 2, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            <Box
              ref={contentRef}
              className="pdf-print-container"
              sx={{
                width: '194mm',
                minHeight: '280mm',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #cbd5e1',
                fontFamily: '"Times New Roman", Times, serif',
                color: '#000000',
                p: '6mm',
                boxSizing: 'border-box'
              }}
            >
              <style>
                {`
                  .pdf-table-container table { 
                    background-color: #ffffff !important; 
                    width: 100% !important;
                    table-layout: fixed !important;
                    border-collapse: collapse !important;
                    box-sizing: border-box !important;
                  }
                  .pdf-table-container tr { 
                    background-color: #ffffff !important; 
                    page-break-inside: avoid !important;
                    box-sizing: border-box !important;
                  }
                  .pdf-table-container td { 
                    background-color: #ffffff !important; 
                    word-wrap: break-word !important;
                    word-break: break-word !important;
                    white-space: normal !important;
                    font-family: "Times New Roman", Times, serif !important;
                    color: #000000 !important;
                    box-sizing: border-box !important;
                  }
                  .pdf-table-container th {
                    background-color: #ffffff !important; 
                    white-space: nowrap !important;
                    font-family: "Times New Roman", Times, serif !important;
                    color: #000000 !important;
                    font-weight: bold !important;
                    box-sizing: border-box !important;
                  }
                  .pdf-table-container th.header-cell, .pdf-table-container td.header-cell { 
                    background-color: #d1d5db !important; 
                  }
                `}
              </style>

              {/* Dynamic Company Header Box (Renders ONLY if company info is present) */}
              {(companyName || fullAddressStr || phone || gstin || email || website || logoSrc) && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0, border: '1px solid #000', borderBottom: 'none', p: 1.5, boxSizing: 'border-box', width: '100%' }}>
                  <Box sx={{ width: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', pr: 1 }}>
                    {logoSrc ? (
                      <img src={logoSrc} alt="Company Logo" style={{ maxWidth: '100%', maxHeight: 85, objectFit: 'contain' }} />
                    ) : (
                      <Logo height={70} />
                    )}
                  </Box>

                  <Box sx={{ flex: 1, textAlign: 'center', pr: 1 }}>
                    {companyName ? (
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.3, fontFamily: 'inherit', color: '#000', fontSize: '17px', textTransform: 'uppercase' }}>
                        {companyName}
                      </Typography>
                    ) : null}

                    {fullAddressStr ? (
                      <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#000', mb: 0.2, fontWeight: 600, fontSize: '11.5px' }}>
                        {fullAddressStr}
                      </Typography>
                    ) : null}

                    {stateCountryStr ? (
                      <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#000', mb: 0.2, fontWeight: 600, fontSize: '11.5px' }}>
                        {stateCountryStr}
                      </Typography>
                    ) : null}

                    {phone ? (
                      <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#000', mb: 0.2, fontWeight: 600, fontSize: '11.5px' }}>
                        Phone : {phone}
                      </Typography>
                    ) : null}

                    {/* GSTIN Label & Value rendered ONLY if gstin exists */}
                    {gstin ? (
                      <Typography variant="body1" sx={{ fontFamily: 'inherit', color: '#000', mb: 0.2, fontWeight: 'bold', fontSize: '11.5px' }}>
                        GSTIN: {gstin}
                      </Typography>
                    ) : null}

                    {(email || website) ? (
                      <Typography variant="body2" sx={{ fontFamily: 'inherit', color: '#000', fontWeight: 600, fontSize: '11px' }}>
                        {email ? `Email: ${email}` : ''}
                        {email && website ? '  |  ' : ''}
                        {website ? `Web Site : ${website}` : ''}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              )}

              <div className="pdf-table-container" style={{ width: '100%' }}>
                {/* Main Schedule Info Table */}
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: 0 }}>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="header-cell" style={{ border: '1px solid #000', textAlign: 'center', padding: '6px', fontWeight: 'bold', backgroundColor: '#d1d5db', fontSize: '13px', textTransform: 'uppercase' }}>
                        AUDIT SCHEDULE REPORT
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', width: '22%', fontWeight: 'bold', fontSize: '11.5px' }}>Schedule No</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', width: '28%', fontSize: '11.5px' }}>{displayScheduleNo}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', width: '22%', fontWeight: 'bold', fontSize: '11.5px' }}>Auditee</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', width: '28%', fontSize: '11.5px' }}>{displayAuditee}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Schedule Date</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>{displayAuditDate}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Auditor</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>
                        {(() => {
                          if (!displayAuditor || displayAuditor === '-') {
                            if (activeRowData?.externalName) {
                              return `${activeRowData.externalName} (External)`;
                            }
                          }
                          return displayAuditor;
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Audit Type</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>{displayAuditType}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>NCR Approved By</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>{formatNameOnly(activeRowData?.ncrApprovedBy || activeRowData?.ncrApprovedByEntity)}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Audit Area</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>{activeRowData?.auditArea || activeRowData?.auditAreaEntity?.description || row?.auditArea || '-'}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Status</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px', fontWeight: 'bold' }}>{displayStatus}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Department Name</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>{displayDepartment}</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontWeight: 'bold', fontSize: '11.5px' }}>Frequency</td>
                      <td style={{ border: '1px solid #000', padding: '5px 6px', fontSize: '11.5px' }}>{activeRowData?.frequency || row?.frequency || 'NONE'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Criteria Details Table */}
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
                  <colgroup>
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '52%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '12%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th colSpan={6} className="header-cell" style={{ border: '1px solid #000', borderTop: 'none', backgroundColor: '#d1d5db', padding: '6px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Criteria Details
                      </th>
                    </tr>
                    <tr>
                      <th style={{ border: '1px solid #000', padding: '5px 4px', width: '6%', textAlign: 'center', fontSize: '11.5px' }}>S.No</th>
                      <th style={{ border: '1px solid #000', padding: '5px 4px', width: '9%', textAlign: 'center', fontSize: '11.5px' }}>Seq No</th>
                      <th style={{ border: '1px solid #000', padding: '5px 4px', width: '8%', textAlign: 'center', fontSize: '11.5px' }}>Clause</th>
                      <th style={{ border: '1px solid #000', padding: '5px 6px', width: '52%', textAlign: 'center', fontSize: '11.5px' }}>Criteria</th>
                      <th style={{ border: '1px solid #000', padding: '5px 4px', width: '13%', textAlign: 'center', fontSize: '11.5px' }}>Attachment</th>
                      <th style={{ border: '1px solid #000', padding: '5px 4px', width: '12%', textAlign: 'center', fontSize: '11.5px' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteriaList.map((crit, index) => {
                      const isAttachReq = crit.attachmentReq === true || crit.attachmentReq === 'YES' || crit.attachmentReq === 'true';
                      return (
                        <tr key={index}>
                          <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                            {index + 1}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                            {crit.seqNo || crit.checklist?.seqNo || '-'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontSize: '11px' }}>
                            {crit.clause || crit.checklist?.clause || '-'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                            {crit.criteriaDetails || crit.checklist?.description || crit.criteria || '-'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                            {isAttachReq ? 'YES' : 'NO'}
                          </td>
                          <td style={{ border: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontSize: '11px' }}>
                            {crit.remarks || '-'}
                          </td>
                        </tr>
                      );
                    })}
                    {criteriaList.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ border: '1px solid #000', padding: '10px', textAlign: 'center', fontSize: '12px' }}>
                          No criteria details found for this audit schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Standard BOS Button UI Actions Matching Existing Pages */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #f1f5f9', gap: 1 }}>
        <Button
          variant="contained"
          sx={btnCancel}
          onClick={onClose}
          disabled={loading}
        >
          Close
        </Button>
        <Button
          variant="contained"
          sx={btnClear}
          startIcon={<IconDownload size={18} />}
          onClick={handleDownloadPdf}
          disabled={loading}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          sx={btnSave}
          startIcon={<IconPrinter size={18} />}
          onClick={() => reactToPrintFn()}
          disabled={loading}
        >
          Print Report
        </Button>
      </DialogActions>
    </Dialog>
  );
}
