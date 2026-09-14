import React, { useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, IconButton, Stack, Typography, Button } from '@mui/material';
import { IconX, IconPrinter, IconDownload } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'react-qr-code';
import html2pdf from 'html2pdf.js';
import { getPhotoUrl } from 'ui-component/bos/BOSUtils';

// ── Date formatter ──────────────────────────────────────────────────────────────
const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    hours = String(hours).padStart(2, '0');
    return `${date} ${hours}:${mins}`; // 24h format as seen in screenshot
  } catch {
    return '-';
  }
};

const formatQrDateTime = (dateVal) => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${date} ${hours}:${mins}:${secs}.0`;
  } catch {
    return '-';
  }
};

export default function VisitorGatePassPDFDialog({ open, onClose, row, company }) {
  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef, pageStyle: `
    @page { size: A4 portrait; margin: 10mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  ` });

  const handleDownloadPdf = () => {
    const element = contentRef.current;
    if (!element) return;
    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     `GatePass_${row.gatePassNo || 'Doc'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, allowTaint: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!row || !company) return null;

  // The QR value should contain the full details as requested
  const qrRawText = `Gate Pass No :${row.gatePassNo || '-'}
Gate Pass Date :${row.gatePassDate ? row.gatePassDate.split('T')[0] : '-'}
Visitor Name :${row.visitorName || '-'}
Visitor Mobile No:${row.mobileNo || '-'}
Address:${row.address || '-'}
Food Required:${row.foodAllowance === 'YES' ? 'Yes' : 'No'}
No Of Persons:${row.noOfPersons || '1.0'}
Kit:${row.kit ? 'ALLOWED' : 'NOT ALLOWED'}
To Meet:${row.personToMeet || '-'}
Purpose:${row.purpose || '-'}
In Time:${formatQrDateTime(row.inTime || row.createdDate)}
Out Time:${formatQrDateTime(row.outTime)}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f1f5f9' }}>
        <Typography variant="h4">Visitor Gate Pass Print Preview</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleDownloadPdf} color="secondary" title="Download PDF">
            <IconDownload size={20} />
          </IconButton>
          <IconButton onClick={() => reactToPrintFn()} color="primary" title="Print PDF">
            <IconPrinter size={20} />
          </IconButton>
          <IconButton onClick={onClose} size="small" title="Close"><IconX /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
        {/* A4 Paper Container */}
        <Box sx={{ p: 4, width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
          <Box
            ref={contentRef}
            sx={{
              width: '194mm',
              bgcolor: 'background.paper',
              border: '1px solid #ccc',
              position: 'relative',
              p: '2mm',
              boxSizing: 'border-box',
              fontFamily: 'Times New Roman, serif'
            }}
          >
            {/* 1. Header Section */}
            <Box sx={{ display: 'flex', mb: 1, border: '1px solid #000', p: 1, position: 'relative' }}>
              {/* Logo */}
              <Box sx={{ width: 150, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {company.logoFileName ? (
                  <img src={getPhotoUrl(company.logoFileName)} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <Typography variant="caption">No Logo</Typography>
                )}
              </Box>

              {/* Company Info */}
              <Box sx={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 2 }}>
                {company.companyName && (
                  <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'Times New Roman, serif', color: '#000', mb: 0.5, fontSize: '18px' }}>
                    {company.companyName}
                  </Typography>
                )}
                {(company.address || company.city || company.state) && (
                  <Typography variant="body2" sx={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', fontWeight: 'bold' }}>
                    {[company.address, company.city, company.pincode].filter(Boolean).join(', ')}
                    {(company.address || company.city || company.pincode) && (company.state || company.country) ? <br/> : ''}
                    {[company.state, company.country].filter(Boolean).join(', ')}
                  </Typography>
                )}
                {(company.phoneNo || company.mobileNo) && (
                  <Typography variant="body2" sx={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', fontWeight: 'bold' }}>
                    Phone : {company.phoneNo || company.mobileNo}
                  </Typography>
                )}
                {company.gstIn && company.gstIn.trim() !== '' && company.gstIn !== '-' && (
                  <Typography variant="body2" sx={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', fontWeight: 'bold' }}>
                    GSTIN : {company.gstIn}
                  </Typography>
                )}
                {(company.emailId || company.website) && (
                  <Typography variant="body2" sx={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', mt: 0.5, fontWeight: 'bold' }}>
                    {company.emailId ? `Email : ${company.emailId}` : ''}
                    {company.emailId && company.website ? ' \u00A0\u00A0 ' : ''}
                    {company.website ? `Web Site : ${company.website}` : ''}
                  </Typography>
                )}
                {(() => {
                  const rawLoc = company.gmaplink || company.gmapLink || company.googleMapLink || company.location;
                  if (!rawLoc || typeof rawLoc !== 'string' || rawLoc.trim() === '' || rawLoc.trim() === '-') return null;
                  const locUrl = rawLoc.trim().startsWith('http') 
                    ? rawLoc.trim() 
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawLoc.trim())}`;
                  return (
                    <Typography variant="body2" sx={{ fontFamily: 'Times New Roman, serif', fontSize: '12px', mt: 0.5, fontWeight: 'bold' }}>
                      Location : <a href={locUrl} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>{rawLoc}</a>
                    </Typography>
                  );
                })()}
              </Box>

              {/* QR Code */}
              <Box sx={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #000', pl: 1 }}>
                <QRCode value={qrRawText} size={100} style={{ width: '100%', height: '100%' }} />
              </Box>
            </Box>

            {/* 2. Title Row */}
            <Box sx={{ bgcolor: '#4fc3f7', border: '1px solid #000', borderTop: 'none', textAlign: 'center', py: 0.5 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                VISITOR PASS
              </Typography>
            </Box>

            {/* 3. Details Table & Watermarks */}
            <Box sx={{ display: 'flex', border: '1px solid #000', borderTop: 'none' }}>
              
              {/* Left Column - Details */}
              <Box sx={{ width: '60%', borderRight: '1px solid #000' }}>
                {[
                  { label: 'Gate Pass No', value: row.gatePassNo, show: Boolean(row.gatePassNo) },
                  { label: 'Visitor Name', value: row.visitorName, show: Boolean(row.visitorName) },
                  { label: 'Visitor Mobile No', value: row.mobileNo, show: Boolean(row.mobileNo) },
                  { label: 'Visitor Address', value: row.address, show: Boolean(row.address) },
                  { label: 'Party Name', value: row.personName, show: Boolean(row.personName && row.personName.trim() !== '' && row.personName.toUpperCase() !== 'NIL') },
                  { label: 'Food Required', value: row.foodAllowance === 'YES' ? 'Yes' : 'No', show: Boolean(row.foodAllowance) },
                  { label: 'No Of Person', value: row.noOfPersons, show: Boolean(row.noOfPersons) },
                  { label: 'Gadgets', value: row.kit ? 'ALLOWED' : 'NOT ALLOWED', show: row.kit !== undefined && row.kit !== null },
                  { label: 'To Meet', value: row.personToMeet, show: Boolean(row.personToMeet && row.personToMeet.trim() !== '') },
                  { label: 'Purpose', value: row.purpose, show: Boolean(row.purpose && row.purpose.trim() !== '') },
                  { label: 'In Time', value: formatDateTime(row.inTime || row.createdDate), show: Boolean(row.inTime || row.createdDate) },
                  { label: 'Out Time', value: formatDateTime(row.outTime), show: Boolean(row.outTime) },
                  { label: 'Company Location', value: company.gmaplink || company.gmapLink || company.googleMapLink || company.location, show: Boolean((company.gmaplink || company.gmapLink || company.googleMapLink || company.location) && (company.gmaplink || company.gmapLink || company.googleMapLink || company.location) !== '-') }
                ].filter(item => item.show).map((item, idx, arr) => (
                  <Box key={idx} sx={{ display: 'flex', borderBottom: idx < arr.length - 1 ? '1px solid #000' : 'none', minHeight: 24, alignItems: 'center' }}>
                    <Box sx={{ width: '40%', borderRight: '1px solid #000', pl: 1 }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '12px', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '60%', pl: 1 }}>
                      {item.label === 'Company Location' && String(item.value).startsWith('http') ? (
                        <a href={item.value} target="_blank" rel="noreferrer" style={{ fontSize: '12px', fontFamily: 'Times New Roman, serif', color: 'blue' }}>{item.value}</a>
                      ) : (
                        <Typography sx={{ fontSize: '12px', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Right Column - Signatures */}
              <Box sx={{ width: '40%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flex: 1, borderBottom: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   <Typography sx={{ 
                     position: 'absolute', transform: 'rotate(-30deg)', opacity: 0.3,
                     fontWeight: 'bold', fontSize: '24px', fontFamily: 'Times New Roman, serif', color: '#000', letterSpacing: 2
                   }}>
                     SECURITY SIGN
                   </Typography>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   <Typography sx={{ 
                     position: 'absolute', transform: 'rotate(-30deg)', opacity: 0.3,
                     fontWeight: 'bold', fontSize: '24px', fontFamily: 'Times New Roman, serif', color: '#000', letterSpacing: 2
                   }}>
                     VISITOR SIGN
                   </Typography>
                </Box>
              </Box>

            </Box>

            {/* 4. Instructions Header */}
            <Box sx={{ bgcolor: '#4fc3f7', border: '1px solid #000', borderTop: 'none', textAlign: 'center', py: 0.5 }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                INSTRUCTIONS
              </Typography>
            </Box>

            {/* 5. Instructions Body */}
            <Box sx={{ border: '1px solid #000', borderTop: 'none' }}>
              {[
                "1. All bags and personal items will be security screened, and visitors may pass through a metal detector.",
                "2. Familiarize yourself with emergency exits, evacuation routes, and assembly points; follow staff instructions in emergencies.",
                "3. In an emergency, use emergency exits and assemble at the EMERGENCY ASSEMBLE POINT near the security area.",
                "4. Photographing without authorization is strictly prohibited.",
                "5. Do not connect electronic devices to the company network without authorization.",
                "6. Report hazards, injuries, or unsafe conditions to staff and adhere to posted health and safety guidelines.",
                "7. Report to security and ensure all personal belongings are taken upon departure.",
                "8. You are under surveillance"
              ].map((text, idx) => (
                <Box key={idx} sx={{ borderBottom: idx < 7 ? '1px solid #000' : 'none', px: 1, py: 0.5 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: '11px', fontFamily: 'Times New Roman, serif', color: '#000' }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>

          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
