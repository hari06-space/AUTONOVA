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
  Button,
  Chip,
  Grid
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
    return format(d, 'dd/MM/yyyy');
  } catch {
    return String(dateVal);
  }
};

const extractTextValue = (val, defaultVal = '-') => {
  if (!val) return defaultVal;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    return val.meetingName || val.departmentName || val.name || val.title || val.status || val.label || defaultVal;
  }
  return String(val) || defaultVal;
};

const formatNameOnly = (val) => {
  if (!val) return '-';
  if (typeof val === 'string') {
    if (val.startsWith('{') && val.endsWith('}')) {
      try {
        const parsed = JSON.parse(val);
        return parsed.employeeName || parsed.label || parsed.name || val;
      } catch (e) { }
    }
    if (val.includes(' - ')) {
      return val.split(' - ')[0].trim();
    }
    return val;
  }
  if (typeof val === 'object' && val !== null) {
    return val.employeeName || val.name || val.label || val.title || '-';
  }
  return String(val) || '-';
};

const to12h = (timeVal) => {
  if (!timeVal) return '-';
  const str = String(timeVal).trim();
  if (!str || str === '-' || str === 'null' || str === 'undefined') return '-';
  if (str.toUpperCase().includes('AM') || str.toUpperCase().includes('PM')) {
    return str;
  }
  if (Array.isArray(timeVal)) {
    const h24 = parseInt(timeVal[0], 10);
    const m = parseInt(timeVal[1], 10);
    const h12 = h24 % 12 || 12;
    const modifier = h24 >= 12 ? 'PM' : 'AM';
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${modifier}`;
  }
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h24 = parseInt(parts[0], 10);
    const m = parts[1].substring(0, 2);
    if (!isNaN(h24)) {
      const h12 = h24 % 12 || 12;
      const modifier = h24 >= 12 ? 'PM' : 'AM';
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${modifier}`;
    }
  }
  return str;
};

const resolveParticipant = (att, employeesList = []) => {
  if (!att) return { name: '-', code: '-', dept: '-', inTime: '-', outTime: '-', status: 'ABSENT' };

  let name = '-';
  let code = '-';
  let dept = '-';
  const empObj = att.employee || (typeof att === 'object' ? att : null);
  const empId = empObj?.id || att.employeeId;

  let matchedEmp = null;
  if (empId && Array.isArray(employeesList) && employeesList.length > 0) {
    matchedEmp = employeesList.find(e => String(e.id) === String(empId));
  }

  const rawOldCode = empObj?.oldEmpCode || empObj?.oldCode || matchedEmp?.oldEmpCode || matchedEmp?.oldCode || att.oldEmpCode || att.oldCode;
  const rawEmpCode = empObj?.empCode || empObj?.employeeCode || empObj?.employeeId || matchedEmp?.empCode || matchedEmp?.employeeCode || matchedEmp?.employeeId || att.empCode || att.employeeCode || att.code;

  code = rawOldCode || rawEmpCode || '-';
  name = formatNameOnly(empObj || att);

  const rawDept = empObj?.departmentName || empObj?.department?.deptName || empObj?.department?.departmentName || matchedEmp?.departmentName || matchedEmp?.department?.deptName || matchedEmp?.department?.departmentName || att.departmentName || att.department || att.deptName || '-';
  dept = typeof rawDept === 'object' ? (rawDept.deptName || rawDept.departmentName || rawDept.name || '-') : String(rawDept || '-');

  const rawIn = att.inTime || empObj?.inTime;
  const rawOut = att.outTime || empObj?.outTime;

  const inTime = to12h(rawIn);
  const outTime = to12h(rawOut);

  let status = 'ABSENT';
  if (att.attendanceStatus) {
    status = extractTextValue(att.attendanceStatus, (inTime !== '-' ? 'PRESENT' : 'ABSENT'));
  } else if (att.statusObj) {
    status = extractTextValue(att.statusObj.name, (inTime !== '-' ? 'PRESENT' : 'ABSENT'));
  } else if (att.status) {
    status = extractTextValue(att.status, (inTime !== '-' ? 'PRESENT' : 'ABSENT'));
  } else if (inTime !== '-') {
    status = 'PRESENT';
  }

  return { name, code, dept, inTime, outTime, status };
};

export default function MomPDFDialog({ open, onClose, momId, row }) {
  const contentRef = useRef(null);
  const [momData, setMomData] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    pageStyle: `
      @page { size: A4 portrait; margin: 0.5mm; }
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
    const safeNo = extractTextValue(momData?.momNo || row?.momNo || 'Minutes_of_Meeting').replace(/[\/\\]/g, '_');
    const opt = {
      margin: [3, 3, 3, 3],
      filename: `MOM_Report_${safeNo}.pdf`,
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

      // Fetch dynamic company profile (silent on failure)
      axios.get('/api/company-profile/all', { skipGlobalAlert: true }).then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCompany(res.data[0]);
        } else if (res.data && typeof res.data === 'object') {
          setCompany(res.data);
        }
      }).catch(() => { });

      // Fetch employee master list for oldEmpCode mapping (silent on failure)
      axios.get('/api/master/hr/employees', { skipGlobalAlert: true }).then((res) => {
        if (Array.isArray(res.data)) {
          setEmployees(res.data);
        }
      }).catch(() => { });

      const targetId = momId || row?.id;
      if (targetId) {
        axios.get(`${API_PATHS.QMS.MOMS}/${targetId}`, { skipGlobalAlert: true })
          .then(async (res) => {
            const fetchedMom = res.data || {};
            let attList = (row?.attendanceList && row.attendanceList.length > 0)
              ? row.attendanceList
              : (fetchedMom.attendanceList || fetchedMom.attendance || []);

            // Fallback: If attendance is empty, fetch schedule participants / attendance
            const schId = fetchedMom.schedule?.id || row?.schedule?.id || row?.scheduleId;

            if ((!attList || attList.length === 0) && schId) {
              try {
                const attRes = await axios.get(`/api/qms/meeting-schedule/${schId}/attendance`, { skipGlobalAlert: true });
                if (attRes?.data && Array.isArray(attRes.data) && attRes.data.length > 0) {
                  attList = attRes.data;
                } else if (fetchedMom.schedule?.participants && Array.isArray(fetchedMom.schedule.participants)) {
                  attList = fetchedMom.schedule.participants;
                }
              } catch (e) {
                if (fetchedMom.schedule?.participants && Array.isArray(fetchedMom.schedule.participants)) {
                  attList = fetchedMom.schedule.participants;
                }
              }
            } else if ((!attList || attList.length === 0) && fetchedMom.schedule?.participants) {
              attList = fetchedMom.schedule.participants;
            }

            let detList = (row?.details && row.details.length > 0)
              ? row.details
              : (fetchedMom.details || fetchedMom.items || []);

            setMomData({
              ...fetchedMom,
              ...row,
              attendanceList: attList,
              details: detList
            });
          })
          .catch((err) => {
            console.error('Failed to fetch full MOM details for PDF:', err);
            setMomData(row);
          })
          .finally(() => setLoading(false));
      } else if (row) {
        let attList = row.attendanceList || row.attendance || [];
        if ((!attList || attList.length === 0) && row.schedule?.participants) {
          attList = row.schedule.participants;
        }
        setMomData({ ...row, attendanceList: attList });
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [open, momId, row]);

  const activeMom = momData || row;

  // Resolve Schedule info safely
  const sch = activeMom?.schedule || {};
  const scheduleNo = extractTextValue(activeMom?.momNo || sch.scheduleNo);
  const meetingType = extractTextValue(activeMom?.meetingTypeName || sch.meetingType || sch.meetingTypeName);
  const departmentName = extractTextValue(activeMom?.departmentName || sch.departmentName || sch.department);
  const chairedByName = formatNameOnly(activeMom?.chairedBy || activeMom?.chairedByName || sch.chairedBy);
  const hostByName = formatNameOnly(activeMom?.hostBy || activeMom?.hostByName || sch.hostBy || sch.hostName || activeMom?.hostName);
  const momDateStr = formatDisplayDate(activeMom?.momDate || sch.meetingDate);
  const startTimeStr = extractTextValue(activeMom?.startTime || sch.startTime);
  const endTimeStr = extractTextValue(activeMom?.endTime || sch.endTime);
  const statusStr = extractTextValue(activeMom?.status, 'OPEN');

  // Attendance list
  const attendanceList = activeMom?.attendanceList || activeMom?.attendance || [];

  // Discussion & Action Items
  const detailsList = activeMom?.details || activeMom?.items || [];

  // Summary counts for Observation Details
  const totalDetailsCount = detailsList.length;
  const openCount = detailsList.filter(d => {
    const s = String(extractTextValue(d.status)).toUpperCase();
    return s === 'OPEN' || s === 'PENDING' || s === 'CREATED';
  }).length;
  const closedCount = detailsList.filter(d => {
    const s = String(extractTextValue(d.status)).toUpperCase();
    return s === 'CLOSED' || s === 'COMPLETED' || s === 'VERIFIED';
  }).length;
  const pendingCount = detailsList.filter(d => {
    const s = String(extractTextValue(d.status)).toUpperCase();
    return s.includes('VERIFY');
  }).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, bgcolor: '#fee2e2', borderRadius: 2, display: 'flex', color: '#dc2626' }}>
            <IconFileTypePdf size={24} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
              Minutes of Meeting PDF Report
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {activeMom?.momNo ? `Meeting Schedule No: ${activeMom.momNo}` : 'Print or download full MOM report'}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f1f5f9' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} thickness={4} color="primary" />
            <Typography variant="body2" sx={{ mt: 2, color: '#64748b', fontWeight: 600 }}>
              Generating Meeting Minutes PDF Report...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            {/* ── Printable PDF Document Container ── */}
            <Box
              ref={contentRef}
              className="pdf-print-container"
              sx={{
                width: '210mm',
                minHeight: '297mm',
                bgcolor: '#ffffff',
                p: '6mm 6mm 6mm 6mm',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                borderRadius: '4px',
                color: '#1e293b',
                fontFamily: '"Public Sans", sans-serif, Arial',
                fontSize: '11px',
                boxSizing: 'border-box'
              }}
            >
              {/* Header: Company Info & Logo */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 2, mb: 2, borderBottom: '2px solid #0f172a' }}>
                <Box sx={{ maxWidth: '65%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5, fontSize: '15px' }}>
                    {company?.companyName || company?.name || 'NUTECH WIND PARTS PRIVATE LIMITED'}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>
                    {company?.addressLine1 || company?.address || ''} {company?.addressLine2 || ''}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>
                    {company?.city ? `${company.city}, ` : ''}{company?.state ? `${company.state} ` : ''}{company?.pincode ? `- ${company.pincode}` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: '10px', color: '#475569', mt: 0.3 }}>
                    Email: {company?.email || 'quality@nutechwind.com'} | Phone: {company?.phone || '-'}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  {company?.logo ? (
                    <img src={company.logo.startsWith('http') || company.logo.startsWith('data:') ? company.logo : `${API_BASE}/${company.logo}`} alt="Logo" style={{ maxHeight: '55px', maxWidth: '160px', objectFit: 'contain' }} />
                  ) : (
                    <Logo />
                  )}
                  <Typography sx={{ fontSize: '9px', fontWeight: 700, color: '#0f172a', mt: 1, textTransform: 'uppercase' }}>
                    QUALITY MANAGEMENT SYSTEM
                  </Typography>
                </Box>
              </Box>

              {/* Title Badge */}
              <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 1, px: 2, textAlign: 'center', borderRadius: '4px', mb: 2.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  MINUTES OF MEETING (MOM) REPORT
                </Typography>
              </Box>

              {/* Grid 1: Meeting Master Summary Info */}
              <Box sx={{ mb: 2.5, border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#f8fafc', px: 1.5, py: 0.8, borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', textTransform: 'uppercase' }}>
                    1. MEETING DETAILS & SUMMARY
                  </Typography>
                  <Chip
                    label={statusStr}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '9px',
                      fontWeight: 800,
                      bgcolor: statusStr === 'CLOSED' ? '#dcfce7' : '#fef9c3',
                      color: statusStr === 'CLOSED' ? '#15803d' : '#854d0e',
                      border: '1px solid',
                      borderColor: statusStr === 'CLOSED' ? '#86efac' : '#fde047'
                    }}
                  />
                </Box>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={tblHeaderStyle}>Meeting Minutes No:</td>
                      <td style={tblCellStyle}><strong>{activeMom?.momNo || '-'}</strong></td>
                      <td style={tblHeaderStyle}>Meeting Date:</td>
                      <td style={tblCellStyle}><strong>{momDateStr}</strong></td>
                    </tr>
                    <tr>
                      <td style={tblHeaderStyle}>Meeting Type:</td>
                      <td style={tblCellStyle}>{meetingType}</td>
                      <td style={tblHeaderStyle}>Department:</td>
                      <td style={tblCellStyle}>{departmentName}</td>
                    </tr>
                    <tr>
                      <td style={tblHeaderStyle}>Chaired By:</td>
                      <td style={tblCellStyle}>{chairedByName}</td>
                      <td style={tblHeaderStyle}>Host Name / Host By:</td>
                      <td style={tblCellStyle}>{hostByName}</td>
                    </tr>
                    <tr>
                      <td style={tblHeaderStyle}>Time Duration:</td>
                      <td style={tblCellStyle}>{startTimeStr} to {endTimeStr}</td>
                      <td style={tblHeaderStyle}>Schedule No:</td>
                      <td style={tblCellStyle}>{activeMom?.observationNo || sch.observationNo || sch.scheduleNo || '-'}</td>
                    </tr>
                    <tr>
                      <td style={tblHeaderStyle}>Observation Summary:</td>
                      <td colSpan={3} style={tblCellStyle}>
                        <strong>Total:</strong> {totalDetailsCount} | <span style={{ color: '#b45309', fontWeight: 700 }}>Open: {openCount}</span> | <span style={{ color: '#15803d', fontWeight: 700 }}>Closed: {closedCount}</span> | <span style={{ color: '#0369a1', fontWeight: 700 }}>Verify Pending: {pendingCount}</span>
                      </td>
                    </tr>
                    {activeMom?.agenda && (
                      <tr>
                        <td style={tblHeaderStyle}>Meeting Agenda:</td>
                        <td colSpan={3} style={{ ...tblCellStyle, color: '#334155', fontStyle: 'italic' }}>
                          {activeMom.agenda}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>

              {/* Grid 2: Meeting Attendance List */}
              <Box sx={{ mb: 2.5, border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#f8fafc', px: 1.5, py: 0.8, borderBottom: '1px solid #cbd5e1' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', textTransform: 'uppercase' }}>
                    2. MEETING PARTICIPANTS & USER ATTENDANCE ({attendanceList.length})
                  </Typography>
                </Box>

                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9.5px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ ...thStyle, width: '4%', textAlign: 'center' }}>S.No</th>
                      <th style={{ ...thStyle, width: '28%', textAlign: 'left' }}>Participant Name</th>
                      <th style={{ ...thStyle, width: '18%', textAlign: 'left' }}>Emp Code</th>
                      <th style={{ ...thStyle, width: '18%', textAlign: 'left' }}>Dept</th>
                      <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>In Time</th>
                      <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Out Time</th>
                      <th style={{ ...thStyle, width: '12%', textAlign: 'center', borderRight: 'none' }}>Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.length > 0 ? (
                      attendanceList.map((att, idx) => {
                        const p = resolveParticipant(att, employees);
                        const statusUpper = String(p.status).toUpperCase().replace(/_/g, ' ');
                        const isAbsent = statusUpper === 'ABSENT';
                        const isWarn = statusUpper.includes('EARLY') || statusUpper.includes('LATE');

                        return (
                          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                            <td style={tdStyle}>{p.code}</td>
                            <td style={tdStyle}>{p.dept}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{p.inTime}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{p.outTime}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', borderRight: 'none' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '3px',
                                  fontSize: '9px',
                                  fontWeight: 800,
                                  backgroundColor: isAbsent ? '#fee2e2' : (isWarn ? '#fef3c7' : '#dcfce7'),
                                  color: isAbsent ? '#b91c1c' : (isWarn ? '#92400e' : '#15803d'),
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', py: 1.5 }}>
                          No participant attendance recorded for this meeting.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>

              {/* Grid 3: Line-wise Discussion & Action Items Table */}
              <Box sx={{ mb: 3, border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#f8fafc', px: 1.5, py: 0.8, borderBottom: '1px solid #cbd5e1' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '11px', color: '#0f172a', textTransform: 'uppercase' }}>
                    3. DISCUSSION & ACTION ITEMS DETAILS ({detailsList.length})
                  </Typography>
                </Box>

                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ ...thStyle, width: '4%', textAlign: 'center' }}>S.No</th>
                      <th style={{ ...thStyle, width: '17%', textAlign: 'center' }}>Item No</th>
                      <th style={{ ...thStyle, width: '33%', textAlign: 'left' }}>Discussion Point / Topic</th>
                      <th style={{ ...thStyle, width: '21%', textAlign: 'left' }}>Action Plan</th>
                      <th style={{ ...thStyle, width: '11%', textAlign: 'left' }}>Assigned To</th>
                      <th style={{ ...thStyle, width: '7%', textAlign: 'center' }}>Target Date</th>
                      <th style={{ ...thStyle, width: '7%', textAlign: 'center', borderRight: 'none' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsList.length > 0 ? (
                      detailsList.map((item, idx) => {
                        const itemNo = extractTextValue(item.minNo || item.meetNo || `ITEM-${idx + 1}`);
                        const discPoint = extractTextValue(item.discussedPoint || item.discussionPoint || item.topic || '-');
                        const actPoint = extractTextValue(item.actionPoint || item.correctiveAction || item.actionPlan || '-');
                        const assignedTo = formatNameOnly(item.assignedUser || item.assignedTo || item.responsibility || '-');
                        const tgtDate = formatDisplayDate(item.targetDate);
                        const status = extractTextValue(item.status, 'OPEN');
                        const isClosed = ['CLOSED', 'VERIFIED', 'COMPLETED'].includes(String(status).toUpperCase());

                        return (
                          <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{itemNo}</td>
                            <td style={{ ...tdStyle, lineHeight: 1.3 }}>{discPoint}</td>
                            <td style={{ ...tdStyle, lineHeight: 1.3, fontWeight: 500 }}>{actPoint}</td>
                            <td style={tdStyle}>{assignedTo}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{tgtDate}</td>
                            <td style={{ ...tdStyle, textAlign: 'center', borderRight: 'none' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  fontSize: '8px',
                                  fontWeight: 800,
                                  backgroundColor: isClosed ? '#dcfce7' : '#fef9c3',
                                  color: isClosed ? '#15803d' : '#854d0e',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', py: 1.5 }}>
                          No action items recorded for this meeting.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Button onClick={onClose} variant="outlined" color="secondary" size="small" sx={{ borderRadius: 2 }}>
          Close
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            onClick={() => reactToPrintFn()}
            disabled={loading}
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<IconPrinter size={18} />}
            sx={{ borderRadius: 2 }}
          >
            Print
          </Button>

          <Button
            onClick={handleDownloadPdf}
            disabled={loading}
            variant="contained"
            color="error"
            size="small"
            startIcon={<IconDownload size={18} />}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Download PDF
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

// ── Shared Inline Table Styles for Clean PDF Output ──
const tblHeaderStyle = {
  width: '18%',
  backgroundColor: '#f8fafc',
  padding: '5px 8px',
  fontWeight: 700,
  color: '#334155',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const tblCellStyle = {
  width: '32%',
  padding: '5px 8px',
  color: '#0f172a',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const thStyle = {
  padding: '5px 6px',
  fontWeight: 800,
  color: '#1e293b',
  borderBottom: '1px solid #cbd5e1',
  borderRight: '1px solid #e2e8f0',
  fontSize: '9px',
  textTransform: 'uppercase',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};

const tdStyle = {
  padding: '5px 6px',
  color: '#334155',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  verticalAlign: 'top',
  wordBreak: 'break-word',
  overflowWrap: 'break-word'
};
