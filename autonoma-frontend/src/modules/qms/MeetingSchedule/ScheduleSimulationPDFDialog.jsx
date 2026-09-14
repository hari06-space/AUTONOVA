import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  Button,
  Chip
} from '@mui/material';
import { IconX, IconPrinter, IconDownload, IconFileTypePdf, IconCalendar, IconCheck, IconClock, IconRoute } from '@tabler/icons-react';
import { useReactToPrint } from 'react-to-print';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import axios from 'utils/axios';
import Logo from 'ui-component/Logo';

const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

const getDayName = (dateStr) => {
  if (!dateStr) return '';
  const cleanStr = String(dateStr).split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()];
  }
  return '';
};

export default function ScheduleSimulationPDFDialog({
  open,
  onClose,
  simulationResult,
  startDate,
  endDate,
  frequency,
  meetingName,
  meetingCode
}) {
  const contentRef = useRef(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const dateStr = format(new Date(), 'ddMMyyyy_HHmm');
    const opt = {
      margin: [6, 6, 6, 6],
      filename: `Meeting_Schedule_Simulation_${dateStr}.pdf`,
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
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open]);

  if (!open) return null;

  const rows = simulationResult?.results || [];
  const totalCandidates = simulationResult?.totalCandidates ?? rows.length;
  const totalScheduled = simulationResult?.totalScheduled ?? rows.filter((r) => r.finalScheduledDate).length;
  const totalSkipped = totalCandidates - totalScheduled;

  const companyName = company?.companyName || company?.name || company?.profileName || 'NUTECH WIND PARTS PVT LTD';
  const companyAddress = [
    company?.address1,
    company?.address2,
    company?.city,
    company?.state,
    company?.pincode
  ].filter(Boolean).join(', ');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: '92vh',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc'
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle sx={{ p: 2, px: 2.5, bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f0f9ff', color: '#0284c7', display: 'flex' }}>
            <IconFileTypePdf size={22} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Meeting Schedule Simulation Report
            </Typography>
            <Typography variant="caption" color="text.secondary">
              A4 Landscape PDF Preview & Export
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: 'grey.500', '&:hover': { bgcolor: 'grey.100' } }}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      {/* Dialog Content with Printable Preview */}
      <DialogContent sx={{ p: 3, display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} sx={{ color: '#0284c7', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">Loading document preview...</Typography>
          </Box>
        ) : (
          <Box
            ref={contentRef}
            className="pdf-print-container"
            sx={{
              width: '100%',
              maxWidth: '1120px',
              bgcolor: '#ffffff',
              p: 4,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
              fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif'
            }}
          >
            {/* Header / Company Branding */}
            <Box sx={{ pb: 2.5, mb: 2.5, borderBottom: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Logo />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.02em', fontSize: '1.25rem' }}>
                    {companyName}
                  </Typography>
                  {companyAddress && (
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem', display: 'block', mt: 0.3 }}>
                      {companyAddress}
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 700, fontSize: '0.75rem', display: 'block', mt: 0.2 }}>
                    QMS Quality Management System • Meeting Schedule Planner
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ textAlign: 'right' }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    bgcolor: '#0f172a',
                    px: 1.8,
                    py: 0.6,
                    borderRadius: 1.5,
                    mb: 0.5,
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)'
                  }}
                >
                  <Typography
                    sx={{
                      color: '#ffffff !important',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      lineHeight: 1.2
                    }}
                  >
                    SIMULATION EVALUATION
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  Generated: {format(new Date(), 'dd/MM/yyyy hh:mm a')}
                </Typography>
              </Box>
            </Box>

            {/* Title Banner */}
            <Box sx={{ bgcolor: '#f8fafc', p: 1.8, px: 2.5, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', textAlign: 'center', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Meeting Schedule Rule Simulation Report
              </Typography>
              {meetingName && (
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0284c7', textAlign: 'center', mb: 1.5, fontSize: '0.88rem' }}>
                  Target Meeting: {meetingName} {meetingCode ? `[${meetingCode}]` : ''}
                </Typography>
              )}

              {/* Simulation Metadata & KPI Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: meetingName ? '1.8fr 1.1fr 1.1fr 1fr 1fr 1fr 1fr' : 'repeat(6, 1fr)', gap: 1.2 }}>
                {meetingName && (
                  <Box sx={{ bgcolor: '#f0f9ff', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #bae6fd' }}>
                    <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>Meeting Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {meetingName}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ bgcolor: '#ffffff', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>Start Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{formatDateDDMMYYYY(startDate)}</Typography>
                </Box>
                <Box sx={{ bgcolor: '#ffffff', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>End Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>{formatDateDDMMYYYY(endDate)}</Typography>
                </Box>
                <Box sx={{ bgcolor: '#ffffff', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>Frequency</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0284c7' }}>{frequency}</Typography>
                </Box>
                <Box sx={{ bgcolor: '#f0f9ff', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #bae6fd' }}>
                  <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>Total Evaluated</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#0284c7' }}>{totalCandidates}</Typography>
                </Box>
                <Box sx={{ bgcolor: '#f0fdf4', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                  <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>Scheduled</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#16a34a' }}>{totalScheduled}</Typography>
                </Box>
                <Box sx={{ bgcolor: '#fff7ed', p: 1, px: 1.2, borderRadius: 1.5, border: '1px solid #fed7aa' }}>
                  <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600, fontSize: '0.68rem', display: 'block' }}>Skipped / Shifted</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#ea580c' }}>{totalSkipped}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Execution Table */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                Rule Execution Log Breakdown ({rows.length} Records)
              </Typography>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #334155', width: '35px' }}>#</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155', width: '110px' }}>Scheduled Date</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155', width: '85px' }}>Day</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155', width: '105px' }}>Date Flags</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155', width: '110px' }}>Rule Policy</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155' }}>Conditions Evaluated</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155', width: '130px' }}>Action Applied</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #334155', width: '100px' }}>Fallback Action</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #334155', width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((row, idx) => {
                      const dayName = row.finalScheduledDate ? getDayName(row.finalScheduledDate) : getDayName(row.candidateDate);
                      const isEven = idx % 2 === 1;

                      let statusBadgeBg = '#f1f5f9';
                      let statusBadgeColor = '#475569';
                      let statusText = row.status || 'DEFAULT';

                      if (row.status === 'MATCHED') {
                        statusBadgeBg = '#dcfce7';
                        statusBadgeColor = '#15803d';
                        statusText = 'MATCHED';
                      } else if (row.status === 'FALLBACK_APPLIED') {
                        statusBadgeBg = '#fef3c7';
                        statusBadgeColor = '#b45309';
                        statusText = 'FALLBACK SHIFT';
                      } else if (row.status === 'SKIPPED') {
                        statusBadgeBg = '#fee2e2';
                        statusBadgeColor = '#b91c1c';
                        statusText = 'SKIPPED';
                      }

                      return (
                        <tr key={idx} style={{ backgroundColor: isEven ? '#f8fafc' : '#ffffff' }}>
                          <td style={{ padding: '6px 4px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600, color: '#64748b' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 800, color: row.finalScheduledDate ? '#15803d' : '#94a3b8' }}>
                            {row.finalScheduledDate ? formatDateDDMMYYYY(row.finalScheduledDate) : 'Skipped'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#334155' }}>
                            {dayName || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                backgroundColor: row.isHoliday ? '#fee2e2' : row.isWeekend ? '#fef3c7' : '#dcfce7',
                                color: row.isHoliday ? '#b91c1c' : row.isWeekend ? '#b45309' : '#15803d'
                              }}
                            >
                              {row.isHoliday ? 'Holiday' : row.isWeekend ? 'Weekend' : 'Working Day'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0369a1' }}>
                            {row.matchedRuleName || 'Default Schedule'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '0.7rem', wordBreak: 'break-word', lineHeight: 1.3 }}>
                            {row.conditionsCheckedSummary || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#0284c7' }}>
                            {row.actionApplied || 'SCHEDULE_MEETING'}
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                            {row.fallbackUsed || '-'}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                backgroundColor: statusBadgeBg,
                                color: statusBadgeColor
                              }}
                            >
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        No simulation records evaluated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Box>

            {/* Footer Sign-off Block */}
            <Box sx={{ pt: 2, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Autonoma BOS(S) • Automated Meeting Rule Engine
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Page 1 of 1
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ fontWeight: 700, borderRadius: 2 }}>
          Close
        </Button>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<IconPrinter size={18} />}
            onClick={() => reactToPrintFn()}
            disabled={loading || !simulationResult}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Print
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconDownload size={18} />}
            onClick={handleDownloadPdf}
            disabled={loading || !simulationResult}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)'
              }
            }}
          >
            Download PDF
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

ScheduleSimulationPDFDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  simulationResult: PropTypes.object,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  frequency: PropTypes.string
};
