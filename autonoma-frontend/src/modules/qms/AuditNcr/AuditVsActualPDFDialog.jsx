import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, IconButton,
  Stack, Typography, CircularProgress, Button, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { IconX, IconPrinter, IconDownload, IconFileTypePdf, IconPalette, IconLetterCase } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import axios from 'utils/axios';
import { API_BASE } from 'utils/api-constants';
import Logo from 'ui-component/Logo';
import { btnCancel } from 'ui-component/bos';

const fmtShort = (s) => {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
};

const consolidateMonthlyItems = (items) => {
  if (!items || items.length === 0) return [];

  const validItems = items.filter((i) => i && i.scheduleDate);
  if (validItems.length === 0) return [];

  const series = [...validItems].sort((a, b) => new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime());

  const uniqueDateItemsMap = new Map();
  series.forEach((item) => {
    const dStr = item.scheduleDateStr || fmtShort(item.scheduleDate);
    if (!uniqueDateItemsMap.has(dStr)) {
      uniqueDateItemsMap.set(dStr, item);
    }
  });

  const uniqueDateSeries = Array.from(uniqueDateItemsMap.values());

  const initialItem = uniqueDateSeries[0];
  const latestItem = uniqueDateSeries[uniqueDateSeries.length - 1];
  const obsItem = series.find((i) => i.rawObservation || i.observationDate) || null;

  const initialDateStr = initialItem.scheduleDateStr || fmtShort(initialItem.scheduleDate);
  const latestDateStr = latestItem.scheduleDateStr || fmtShort(latestItem.scheduleDate);

  const isRescheduled = uniqueDateSeries.length > 1 && initialDateStr !== latestDateStr;
  const rescheduleCount = isRescheduled ? (uniqueDateSeries.length - 1) : 0;
  const pathDates = uniqueDateSeries.map((i) => i.scheduleDateStr || fmtShort(i.scheduleDate));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let executionStatus = 'PENDING';
  if (obsItem && (obsItem.observationDate || obsItem.rawObservation)) {
    executionStatus = 'COMPLETED';
  } else {
    const st = String(latestItem.rawSchedule?.status || '').toUpperCase();
    if (st === 'CLOSED' || st === 'COMPLETED') {
      executionStatus = 'COMPLETED';
    } else {
      const d = latestItem.scheduleDate ? new Date(latestItem.scheduleDate) : null;
      if (d && d < today) {
        executionStatus = 'OVERDUE';
      } else {
        executionStatus = 'PENDING';
      }
    }
  }

  const consolidated = {
    ...latestItem,
    scheduleNo: latestItem.scheduleNo || latestItem.rawSchedule?.scheduleNo || '-',
    initialScheduleDate: initialItem.scheduleDate,
    initialScheduleDateStr: initialDateStr,
    latestScheduleDate: latestItem.scheduleDate,
    latestScheduleDateStr: latestDateStr,
    isRescheduled,
    rescheduleCount,
    pathDates,
    observationNo: obsItem ? obsItem.observationNo : '-',
    observationDate: obsItem ? obsItem.observationDate : null,
    observationDateStr: obsItem ? obsItem.observationDateStr : '-',
    deviationDays: obsItem ? obsItem.deviationDays : 0,
    executionStatus,
    rawObservation: obsItem ? obsItem.rawObservation : null
  };

  return [consolidated];
};

const fmtFull = (s) => {
  if (!s) return '-';
  try { return format(new Date(s), 'dd/MM/yyyy'); } catch { return s; }
};

// Color palette (colour mode)
const C = {
  headerBg:'#74c0e3', activeBg:'#16a34a', pastBg:'#94a3b8',
  planBg:'#bfdbfe', actualBg:'#fad2e1',
  planActiveBg:'#86efac', actActiveBg:'#4ade80',
  planPastBg:'#cbd5e1', actPastBg:'#e2e8f0',
  onTimeBg:'#dcfce7', onTimeColor:'#15803d', onTimeBorder:'#86efac',
  lateBg:'#fee2e2', lateColor:'#b91c1c', lateBorder:'#fca5a5',
  border:'#cbd5e1', border2:'#94a3b8', rowEven:'#ffffff', rowOdd:'#f8fafc',
};

// B&W palette
const BW = {
  headerBg:'#d1d5db', activeBg:'#374151', pastBg:'#9ca3af',
  planBg:'#e5e7eb', actualBg:'#f3f4f6',
  planActiveBg:'#d1d5db', actActiveBg:'#9ca3af',
  planPastBg:'#e5e7eb', actPastBg:'#f3f4f6',
  onTimeBg:'#e5e7eb', onTimeColor:'#111827', onTimeBorder:'#9ca3af',
  lateBg:'#f3f4f6', lateColor:'#374151', lateBorder:'#d1d5db',
  border:'#9ca3af', border2:'#4b5563', rowEven:'#ffffff', rowOdd:'#f9fafb',
};

export default function AuditVsActualPDFDialog({
  open, onClose,
  rows = [], monthColumns = [],
  isDeptTab = false, selectedYear, filters = {}
}) {
  const contentRef = useRef(null);
  const [company, setCompany]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [colorMode, setColorMode] = useState('color');
  const PAL = colorMode === 'color' ? C : BW;

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios.get('/api/company-profile/all')
        .then((res) => {
          let comp = null;
          if (Array.isArray(res.data) && res.data.length > 0) comp = res.data[0];
          else if (res.data && typeof res.data === 'object') comp = res.data;
          setCompany(comp);
        })
        .catch(() => setCompany(null))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `
      @page { size: A3 landscape; margin: 8mm; }
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .pdf-matrix-wrap { width: 100% !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
      }
    `
  });

  const handleDownloadPdf = () => {
    const element = contentRef.current;
    if (!element) return;
    const title = isDeptTab ? 'Department_Wise_Audit_vs_Actual' : 'AuditType_Wise_Audit_vs_Actual';
    const opt = {
      margin: [6, 4, 6, 4],
      filename: title + '_' + (selectedYear||'') + '_' + format(new Date(), 'yyyyMMdd_HHmm') + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!open) return null;

  const companyName = company?.companyName || company?.name || 'AUTONOVA';
  const address1    = company?.address || company?.address1 || '2/555A, Babu Jagajeevanram Street';
  const city        = company?.city || 'Gerugambakkam, Chennai';
  const pincode     = company?.pincode || '600122';
  const state2      = company?.state || 'TAMILNADU';
  const gstin       = company?.gstin || company?.gstNo || '33AABCN4970C1ZS';
  const phone       = company?.phone || company?.mobileNo || '';
  const email       = company?.email || company?.emailId || '';
  const website     = company?.website || company?.webSite || '';
  const fullAddress = [address1, city ? city + (pincode ? ' - ' + pincode : '') : pincode, state2].filter(Boolean).join(', ');
  const contactLine = [phone && 'Mob: ' + phone, email && 'Email: ' + email, website && 'Web: ' + website].filter(Boolean).join(' | ');
  const reportTitle = isDeptTab ? 'DEPARTMENT WISE — AUDIT VS ACTUAL REPORT' : 'AUDIT TYPE WISE — AUDIT VS ACTUAL REPORT';
  let logoSrc = null;
  if (company?.logoUrl) logoSrc = company.logoUrl;
  else if (company?.logo) logoSrc = company.logo;
  else if (company?.logoName) logoSrc = API_BASE + '/api/company-profile/image/' + company.logoName;

  const cs = (extra) => Object.assign({
    border: '1px solid ' + PAL.border,
    padding: '4px 5px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: '10px',
  }, extra || {});

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth
      PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden', height: '95vh' } }}>

      <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconFileTypePdf size={24} color="#d32f2f" />
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Audit vs Actual — PDF Preview ({rows.length} records)
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup value={colorMode} exclusive onChange={(_, v) => { if (v) setColorMode(v); }} size="small"
            sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', p: 0.3,
              '& .MuiToggleButton-root': { border: 0, borderRadius: '6px !important', px: 1.2, py: 0.3, fontSize: '0.74rem', fontWeight: 700, textTransform: 'none', gap: 0.5,
                '&.Mui-selected': { bgcolor: '#1e293b', color: '#fff' } } }}>
            <ToggleButton value="color"><IconPalette size={14} />Color</ToggleButton>
            <ToggleButton value="bw"><IconLetterCase size={14} />Black &amp; White</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" color="secondary" size="small" startIcon={<IconDownload size={16} />} onClick={handleDownloadPdf} disabled={loading}>Download PDF</Button>
          <Button variant="contained" color="primary" size="small" startIcon={<IconPrinter size={16} />} onClick={() => reactToPrintFn()} disabled={loading}>Print</Button>
          <IconButton onClick={onClose} size="small" sx={{ ml: 0.5 }}><IconX size={20} /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2, bgcolor: '#e2e8f0', overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ p: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={28} /><Typography>Loading...</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box ref={contentRef} className="pdf-matrix-wrap"
              sx={{ width: '420mm', minWidth: '420mm', bgcolor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #cbd5e1', p: '8mm', boxSizing: 'border-box', fontFamily: 'Inter, Arial, sans-serif', color: '#000' }}>

              {/* Company Header */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #000', padding: '8px 12px', marginBottom: 0 }}>
                <div style={{ width: 110, display: 'flex', justifyContent: 'center', paddingRight: 12 }}>
                  {logoSrc ? <img src={logoSrc} alt="Logo" style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }} /> : <Logo height={50} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase', marginBottom: 2 }}>{companyName}</div>
                  <div style={{ fontSize: 10, marginBottom: 2 }}>{fullAddress}</div>
                  {gstin && <div style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>GSTIN: {gstin}</div>}
                  {contactLine && <div style={{ fontSize: 10, color: '#333' }}>{contactLine}</div>}
                </div>
                <div style={{ textAlign: 'right', fontSize: 10, color: '#444' }}>
                  <div><b>Generated By:</b> System</div>
                  <div><b>Date:</b> {fmtFull(new Date())}</div>
                  <div><b>Year:</b> {selectedYear ? `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)}` : ''}</div>
                </div>
              </div>

              {/* Report Title */}
              <div style={{ textAlign: 'center', borderLeft: '1.5px solid #000', borderRight: '1.5px solid #000', borderBottom: '1.5px solid #000', padding: '5px', background: '#f8fafc' }}>
                <div style={{ fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', textDecoration: 'underline', letterSpacing: '0.4px' }}>{reportTitle}</div>
              </div>

              {/* Doc Details */}
              <div style={{ borderLeft: '1.5px solid #000', borderRight: '1.5px solid #000', borderBottom: '1.5px solid #000', padding: '5px 10px', background: '#fff', marginBottom: 8, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10 }}><b>DOC. No:</b> QMS/AVA/{format(new Date(), 'yyyy/MMdd')}</span>
                <span style={{ fontSize: 10 }}><b>Report Date:</b> {fmtFull(new Date())}</span>
                <span style={{ fontSize: 10 }}><b>Financial Year:</b> {selectedYear ? `FY ${selectedYear}-${String(selectedYear + 1).slice(-2)}` : ''}</span>
                <span style={{ fontSize: 10 }}><b>Total Records:</b> {rows.length}</span>
                <span style={{ fontSize: 10 }}><b>View:</b> {isDeptTab ? 'Department Wise' : 'Audit Type Wise'}</span>
              </div>

              {/* Matrix Table */}
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '10px', fontFamily: 'Inter, Arial, sans-serif' }}>
                <thead>
                  <tr style={{ height: 30 }}>
                    <th style={cs({ background: PAL.headerBg, fontWeight: 800, textAlign: 'center', width: 26, borderRight: '2px solid ' + PAL.border2 })} rowSpan={2}>#</th>
                    <th style={cs({ background: PAL.headerBg, fontWeight: 800, textAlign: 'left', minWidth: 175, borderRight: '2px solid ' + PAL.border2 })} rowSpan={2}>
                      {isDeptTab ? 'Department & Audit Type' : 'Audit Type & Department'}
                    </th>
                    {monthColumns.map((m) => {
                      const bg  = m.isCurrentMonth ? PAL.activeBg : m.isPastMonth ? PAL.pastBg : PAL.headerBg;
                      const col = m.isCurrentMonth ? '#fff' : '#0f172a';
                      return (
                        <th key={m.monthKey} colSpan={2}
                          style={cs({ background: bg, color: col, fontWeight: 800, textAlign: 'center', borderRight: '2px solid ' + PAL.border2 })}>
                          {m.label}{m.isCurrentMonth ? ' ▶' : ''}
                        </th>
                      );
                    })}
                  </tr>
                  <tr style={{ height: 22 }}>
                    {monthColumns.map((m) => {
                      const pBg = m.isCurrentMonth ? PAL.planActiveBg : m.isPastMonth ? PAL.planPastBg : PAL.planBg;
                      const aBg = m.isCurrentMonth ? PAL.actActiveBg  : m.isPastMonth ? PAL.actPastBg  : PAL.actualBg;
                      return (
                        <React.Fragment key={'sh-' + m.monthKey}>
                          <th style={cs({ background: pBg, fontWeight: 700, textAlign: 'center', minWidth: 52 })}>Plan</th>
                          <th style={cs({ background: aBg, fontWeight: 700, textAlign: 'center', minWidth: 62, borderRight: '2px solid ' + PAL.border2 })}>Actual</th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => {
                    const rbg = rIdx % 2 === 0 ? PAL.rowEven : PAL.rowOdd;
                    const freqStr = ' <span style="font-size:8px;font-weight:800;background:#f1f5f9;color:#475569;padding:1px 3px;border-radius:3px;margin-left:4px;">' + (row.frequency || 'MONTHLY') + '</span>';
                    const nameHtml = isDeptTab
                      ? '<span style="font-weight:800;color:#0369a1;">' + (row.departmentName || 'General') + '</span><br/><span style="font-size:9px;color:#334155;">↳ ' + row.auditType + '</span>' + freqStr
                      : '<span style="font-weight:800;color:#334155;">' + row.auditType + '</span><br/><span style="font-size:9px;color:#0369a1;">🏢 ' + (row.departmentName || 'General') + '</span>' + freqStr;
                    return (
                      <tr key={row.key || rIdx} style={{ pageBreakInside: 'avoid' }}>
                        <td style={cs({ background: rbg, textAlign: 'center', fontWeight: 700, color: '#64748b', borderRight: '2px solid ' + PAL.border2 })}>{rIdx + 1}</td>
                        <td style={cs({ background: rbg, borderRight: '2px solid ' + PAL.border2 })} dangerouslySetInnerHTML={{ __html: nameHtml }} />
                        {monthColumns.map((m) => {
                          const rawItems = row.monthsData[m.monthKey] || [];
                          const items = consolidateMonthlyItems(rawItems);
                          const pBg2 = m.isCurrentMonth ? (items.length > 0 ? PAL.onTimeBg  : '#f0fdf4') : m.isPastMonth ? '#f1f5f9' : rbg;
                          const aBg2 = m.isCurrentMonth ? (items.length > 0 ? '#bbf7d0' : '#ecfdf5') : m.isPastMonth ? '#e2e8f0' : rbg;
                          const planContent = items.length === 0
                            ? React.createElement('span', { style: { color: '#94a3b8' } }, '-')
                            : items.map((i, ii) => React.createElement('div', { key: ii, style: { fontWeight: 700, color: colorMode === 'color' ? '#0369a1' : '#111' } },
                                fmtShort(i.scheduleDate) || i.scheduleDateStr || '-',
                                i.isRescheduled ? React.createElement('div', { style: { fontSize: 8, color: '#d97706', fontWeight: 800 } }, '(Orig: ' + fmtShort(i.initialScheduleDate) + ' · ' + i.rescheduleCount + 'x 🔄)') : null
                              ));
                          const actualContent = items.length === 0
                            ? React.createElement('span', { style: { color: '#94a3b8' } }, '-')
                            : items.map((i, ii) => {
                                if (i.observationDate) {
                                  const ok  = (i.deviationDays ?? 0) <= 0;
                                  return React.createElement('div', { key: ii, style: { display:'inline-flex', alignItems:'center', gap:2, background: ok ? PAL.onTimeBg : PAL.lateBg, color: ok ? PAL.onTimeColor : PAL.lateColor, border: '1px solid ' + (ok ? PAL.onTimeBorder : PAL.lateBorder), borderRadius:3, padding:'1px 4px', fontWeight:800, marginBottom:1 } },
                                    fmtShort(i.observationDate) || i.observationDateStr || '-',
                                    !ok ? React.createElement('span', { style: { fontSize:8, fontWeight:900 } }, '+' + i.deviationDays + 'd') : null
                                  );
                                }
                                const st = (i.executionStatus || '').toUpperCase();
                                const sc = st.includes('PENDING') ? (colorMode === 'color' ? '#f59e0b' : '#555') : st.includes('OVERDUE') ? (colorMode === 'color' ? '#ef4444' : '#222') : '#64748b';
                                return React.createElement('div', { key: ii, style: { fontSize:9, fontWeight:700, color:sc } }, i.executionStatus || '-');
                              });
                          return (
                            <React.Fragment key={rIdx + '_' + m.monthKey}>
                              <td style={cs({ background: pBg2, textAlign: 'center' })}>{planContent}</td>
                              <td style={cs({ background: aBg2, textAlign: 'center', borderRight: '2px solid ' + PAL.border2 })}>{actualContent}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ marginTop: 8, fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                Total Records: {rows.length} &nbsp;|&nbsp; Report Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </div>

              {/* Legend */}
              <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'On-Time',       bg: PAL.onTimeBg, border: PAL.onTimeBorder },
                  { label: 'Delayed (+Xd)', bg: PAL.lateBg,   border: PAL.lateBorder   },
                  { label: 'Active Month',  bg: PAL.activeBg, border: PAL.border2      },
                  { label: 'Past Month',    bg: PAL.pastBg,   border: PAL.border2      },
                ].map((l) => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 11, height: 11, borderRadius: 2, background: l.bg, border: '1px solid ' + l.border }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#374151' }}>{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Signatures */}
              <div style={{ marginTop: 22, paddingTop: 8, borderTop: '1px solid #000', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center', width: 170 }}>
                  <div style={{ fontSize: 10, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 3, marginTop: 22 }}>Prepared By</div>
                  <div style={{ fontSize: 9, color: '#555' }}>Quality Auditor / Lead</div>
                </div>
                <div style={{ textAlign: 'center', width: 170 }}>
                  <div style={{ fontSize: 10, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 3, marginTop: 22 }}>Verified By</div>
                  <div style={{ fontSize: 9, color: '#555' }}>Head — Quality Assurance (QA)</div>
                </div>
              </div>

            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button {...btnCancel} onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
