import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

import {
  IconCalendarEvent,
  IconClock,
  IconRepeat,
  IconUsers,
  IconUserCheck,
  IconBriefcase,
  IconTag,
  IconX,
  IconExternalLink,
  IconClipboardCheck,
  IconAlertCircle,
  IconBuilding
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { getUserImageUrl } from 'utils/upload-helper';

// ─── Status color map ────────────────────────────────────────────────────────
const STATUS_COLORS = {
  OPEN: { bg: '#e3f2fd', color: '#1565c0', label: 'Open' },
  RESCHEDULE: { bg: '#fff3e0', color: '#e65100', label: 'Reschedule' },
  CLOSED: { bg: '#e8f5e9', color: '#2e7d32', label: 'Closed' },
  'AUTO CLOSED': { bg: '#f3e5f5', color: '#6a1b9a', label: 'Auto Closed' },
  CANCELLED: { bg: '#fce4ec', color: '#c62828', label: 'Cancelled' },
  WAITING_APPROVAL: { bg: '#fffde7', color: '#f57f17', label: 'Pending Approval' },
  AMENDED: { bg: '#fff8e1', color: '#b78103', label: 'Amended' }
};

const getStatusStyle = (status) => STATUS_COLORS[status?.toUpperCase()] || { bg: '#f5f5f5', color: '#616161', label: status };

const safeText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'object') {
    return value.departmentName || value.name || value.designationName || value.label || fallback;
  }
  return String(value);
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, color }) {
  const displayVal = safeText(value);
  if (!displayVal || displayVal === '-') return null;
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.6 }}>
      <Box sx={{ mt: 0.2, minWidth: 20, color: color || 'text.secondary' }}>
        <Icon size={16} stroke={1.8} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.1, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', fontSize: '0.62rem' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, wordBreak: 'break-word' }}>
          {displayVal}
        </Typography>
      </Box>
    </Stack>
  );
}

// ─── Participants list ────────────────────────────────────────────────────────
function ParticipantChips({ participants }) {
  const [expanded, setExpanded] = useState(false);
  if (!participants || participants.length === 0) return null;
  const displayList = expanded ? participants : participants.slice(0, 10);
  const hasMore = participants.length > 10;

  return (
    <Box sx={{ pt: 0.5 }}>
      <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ maxHeight: expanded ? 220 : 'none', overflowY: expanded ? 'auto' : 'visible', pr: 0.5 }}>
        {displayList.map((item, i) => {
          const name = typeof item === 'string' ? item : item?.employeeName || item?.name || 'Participant';
          return (
            <Chip
              key={i}
              avatar={
                <Avatar
                  src={getPersonAvatarUrl(item)}
                  alt={name}
                  sx={{ width: 24, height: 24, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.light', color: 'primary.dark' }}
                >
                  {name.charAt(0)}
                </Avatar>
              }
              label={name}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: 28, borderRadius: '14px', border: '1px solid #e2e8f0', bgcolor: '#fff', fontWeight: 500 }}
            />
          );
        })}
      </Stack>
      {hasMore && (
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ mt: 1, fontSize: '0.72rem', textTransform: 'none', fontWeight: 700, p: 0, minWidth: 'auto' }}
        >
          {expanded ? 'Show Less' : `+ ${participants.length - 10} More Participants`}
        </Button>
      )}
    </Box>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, mt: 0.5 }}>
      <Icon size={15} color={color || '#757575'} />
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', fontSize: '0.62rem', color: color || 'text.secondary' }}>
        {title}
      </Typography>
    </Stack>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '-';
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

const fmtTime = (t) => {
  if (!t) return '-';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${m || '00'} ${ampm}`;
};


// Helper to generate visual avatar image URL from employee photo object/filename or fallback to UI Avatar
const getPersonAvatarUrl = (person) => {
  if (!person) return '';
  if (typeof person === 'object') {
    if (person.imgName) return getUserImageUrl(person.imgName);
    if (person.photo) return getUserImageUrl(person.photo);
    if (person.employeePhoto) return getUserImageUrl(person.employeePhoto);
    const name = person.employeeName || person.name || '';
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=random&color=fff&size=128&bold=true`;
    }
  }
  if (typeof person === 'string') {
    if (person.includes('.') && (person.endsWith('.jpg') || person.endsWith('.png') || person.endsWith('.jpeg'))) {
      return getUserImageUrl(person);
    }
    const cleanName = encodeURIComponent(person.trim());
    return `https://ui-avatars.com/api/?name=${cleanName}&background=random&color=fff&size=128&bold=true`;
  }
  return '';
};

// ──────────────────────────────────────────────────────────────────────────────
// INTERVIEW DETAIL PANEL
// ──────────────────────────────────────────────────────────────────────────────
function InterviewDetail({ ext }) {
  const isSelected = String(ext.interviewResult || '').toUpperCase() === 'SELECTED';
  const isRejected = String(ext.interviewResult || '').toUpperCase() === 'REJECTED';
  const resultColor = isSelected ? 'success' : isRejected ? 'error' : 'default';

  return (
    <Stack spacing={2.5}>
      {/* Visual Header Card */}
      <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#6d28d9', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Applicant ID
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#7c3aed', mt: 0.3 }}>
            {ext.candidateCode || '-'}
          </Typography>
        </Box>
        <Chip
          label={ext.interviewResult || ext.interviewStatus || 'Pending'}
          size="medium"
          color={resultColor}
          sx={{ fontWeight: 700, px: 1.5, borderRadius: '10px' }}
        />
      </Box>

      {/* Grid container with proper MUI v6 Grid size property */}
      <Grid container spacing={2}>
        {/* Section 1: Candidate & Position Details */}
        <Grid size={12}>
          <SectionHeader icon={IconTag} title="Candidate & Position Details" color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InfoRow icon={IconTag} label="Candidate Name" value={ext.candidateName} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InfoRow icon={IconBuilding} label="Department" value={ext.department} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InfoRow icon={IconBriefcase} label="Designation" value={ext.designation} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <InfoRow icon={IconTag} label="Round" value={ext.round} color="#7c3aed" />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <InfoRow icon={IconTag} label="Level" value={ext.screeningLevel} color="#7c3aed" />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>

        {/* Section 2: Date & Time Schedule */}
        <Grid size={12}>
          <SectionHeader icon={IconClock} title="Schedule Details" color="#2563eb" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <InfoRow icon={IconCalendarEvent} label="Interview Date" value={fmtDate(ext.interviewDate)} color="#2563eb" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <InfoRow icon={IconClock} label="Start Time" value={fmtTime(ext.startTime)} color="#059669" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <InfoRow icon={IconClock} label="End Time" value={fmtTime(ext.endTime)} color="#dc2626" />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 0.5 }} />
        </Grid>

        {/* Section 3: Assessment */}
        <Grid size={12}>
          <SectionHeader icon={IconUsers} title="Interviewer Assessment" color="#4f46e5" />
        </Grid>
        <Grid size={12}>
          {ext.interviewer && (
            <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#f5f3ff', border: '1px solid #ede9fe', mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#6d28d9', display: 'block', mb: 0.8, fontSize: '0.65rem', textTransform: 'uppercase' }}>Interviewer</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={getPersonAvatarUrl(ext.interviewer)}
                  alt={ext.interviewer}
                  sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {ext.interviewer.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#5b21b6', fontSize: '0.9rem' }}>{ext.interviewer}</Typography>
              </Stack>
            </Box>
          )}
        </Grid>
        <Grid size={12}>
          <InfoRow icon={IconClipboardCheck} label="Interviewer Remarks" value={ext.comments} color="#0f766e" />
        </Grid>
      </Grid>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MEETING DETAIL PANEL
// ──────────────────────────────────────────────────────────────────────────────
function MeetingDetail({ ext }) {
  const statusStyle = getStatusStyle(ext.status);
  return (
    <Stack spacing={2}>
      {/* Schedule Header Card */}
      <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#f0f7ff', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Schedule Reference No
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0284c7', mt: 0.3 }}>
            {ext.scheduleNo || '-'}
          </Typography>
        </Box>
        <Chip
          label={statusStyle.label}
          size="medium"
          sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 700, px: 1, borderRadius: '10px', border: `1px solid ${statusStyle.color}30` }}
        />
      </Box>

      {ext.isNonEditable && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
          <IconAlertCircle size={18} color="#c2410c" />
          <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 700, fontSize: '0.75rem' }}>
            {ext.isPast ? 'Past Schedule — Read Only Record' : 'Closed Schedule — Read Only Record'}
          </Typography>
        </Stack>
      )}

      {/* Grid metadata */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconTag} label="Meeting Type" value={ext.meetingType} color="#0284c7" /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconRepeat} label="Frequency" value={ext.frequency} color="#0284c7" /></Grid>
        <Grid size={12}><InfoRow icon={IconClipboardCheck} label="Subject / Agenda" value={ext.subject || ext.agenda} color="#0f766e" /></Grid>
        <Grid size={12}><InfoRow icon={IconBuilding} label="Target Departments" value={ext.departments} color="#4f46e5" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><InfoRow icon={IconCalendarEvent} label="Meeting Date" value={fmtDate(ext.meetingDate)} color="#2563eb" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><InfoRow icon={IconClock} label="Start Time" value={fmtTime(ext.startTime)} color="#059669" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><InfoRow icon={IconClock} label="End Time" value={fmtTime(ext.endTime)} color="#dc2626" /></Grid>
      </Grid>

      {/* Key Personnel */}
      <Box>
        <SectionHeader icon={IconUsers} title="Participants & Host" color="#0284c7" />
        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
          {ext.chairedBy && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#f0f9ff', border: '1px solid #e0f2fe', boxShadow: '0 2px 8px rgba(2,132,199,0.06)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', display: 'block', mb: 0.8, fontSize: '0.65rem', textTransform: 'uppercase' }}>Chaired By</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={getPersonAvatarUrl(ext.chairedByObj || ext.chairedBy)}
                    alt={ext.chairedBy}
                    sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    {ext.chairedBy.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0c4a6e', fontSize: '0.9rem' }}>{ext.chairedBy}</Typography>
                </Stack>
              </Box>
            </Grid>
          )}
          {ext.host && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#faf5ff', border: '1px solid #f3e8ff', boxShadow: '0 2px 8px rgba(147,51,234,0.06)' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#7e22ce', display: 'block', mb: 0.8, fontSize: '0.65rem', textTransform: 'uppercase' }}>Host</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={getPersonAvatarUrl(ext.hostObj || ext.host)}
                    alt={ext.host}
                    sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    {ext.host.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#581c87', fontSize: '0.9rem' }}>{ext.host}</Typography>
                </Stack>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      {(ext.participantsObj?.length > 0 || ext.participants?.length > 0) && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.4px', textTransform: 'uppercase', mb: 0.8, display: 'block' }}>
            Participants ({ext.participantsObj?.length || ext.participants?.length})
          </Typography>
          <ParticipantChips participants={ext.participantsObj || ext.participants} />
        </Box>
      )}
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// AUDIT DETAIL PANEL
// ──────────────────────────────────────────────────────────────────────────────
function AuditDetail({ ext }) {
  const statusStyle = getStatusStyle(ext.status);
  return (
    <Stack spacing={2}>
      {/* Schedule Header Card */}
      <Box sx={{ p: 2, borderRadius: '16px', bgcolor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Audit Reference No
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626', mt: 0.3 }}>
            {ext.scheduleNo || '-'}
          </Typography>
        </Box>
        <Chip
          label={statusStyle.label}
          size="medium"
          sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 700, px: 1, borderRadius: '10px', border: `1px solid ${statusStyle.color}30` }}
        />
      </Box>

      {ext.isNonEditable && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
          <IconAlertCircle size={18} color="#c2410c" />
          <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 700, fontSize: '0.75rem' }}>
            {ext.isPast ? 'Past Schedule — Read Only Record' : 'Closed Schedule — Read Only Record'}
          </Typography>
        </Stack>
      )}

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconTag} label="Audit Type" value={ext.auditType} color="#dc2626" /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconRepeat} label="Frequency" value={ext.frequency} color="#dc2626" /></Grid>
        <Grid size={12}><InfoRow icon={IconClipboardCheck} label="Audit Area" value={ext.auditArea} color="#0f766e" /></Grid>
        <Grid size={12}><InfoRow icon={IconBuilding} label="Department" value={ext.department} color="#4f46e5" /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconCalendarEvent} label="Audit Date" value={fmtDate(ext.auditDate)} color="#2563eb" /></Grid>
        {ext.auditMonth && <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconCalendarEvent} label="Audit Month" value={ext.auditMonth} color="#2563eb" /></Grid>}
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconClock} label="Start Time" value={fmtTime(ext.startTime)} color="#059669" /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><InfoRow icon={IconClock} label="End Time" value={fmtTime(ext.endTime)} color="#dc2626" /></Grid>
      </Grid>

      <SectionHeader icon={IconUsers} title="Personnel & Audit Team" color="#dc2626" />
      <Grid container spacing={1.5}>
        {ext.auditor && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#fff1f2', border: '1px solid #ffe4e6', boxShadow: '0 2px 8px rgba(225,29,72,0.06)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#be123c', display: 'block', mb: 0.8, fontSize: '0.65rem', textTransform: 'uppercase' }}>Auditor</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={getPersonAvatarUrl(ext.auditorObj || ext.auditor)}
                  alt={ext.auditor}
                  sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {ext.auditor.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#881337', fontSize: '0.9rem' }}>{ext.auditor}</Typography>
              </Stack>
            </Box>
          </Grid>
        )}
        {ext.auditee && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#f0fdf4', border: '1px solid #dcfce7', boxShadow: '0 2px 8px rgba(22,163,74,0.06)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#15803d', display: 'block', mb: 0.8, fontSize: '0.65rem', textTransform: 'uppercase' }}>Auditee</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={getPersonAvatarUrl(ext.auditeeObj || ext.auditee)}
                  alt={ext.auditee}
                  sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {ext.auditee.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#14532d', fontSize: '0.9rem' }}>{ext.auditee}</Typography>
              </Stack>
            </Box>
          </Grid>
        )}
        {ext.ncrApprovedBy && (
          <Grid size={{ xs: 12, sm: 12 }}>
            <Box sx={{ p: 1.5, borderRadius: '14px', bgcolor: '#fefce8', border: '1px solid #fef08a', boxShadow: '0 2px 8px rgba(202,138,4,0.06)' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#a16207', display: 'block', mb: 0.8, fontSize: '0.65rem', textTransform: 'uppercase' }}>NCR Approved By</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={getPersonAvatarUrl(ext.ncrApprovedByObj || ext.ncrApprovedBy)}
                  alt={ext.ncrApprovedBy}
                  sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {ext.ncrApprovedBy.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#713f12', fontSize: '0.9rem' }}>{ext.ncrApprovedBy}</Typography>
              </Stack>
            </Box>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN DIALOG
// ──────────────────────────────────────────────────────────────────────────────
export default function ScheduleDetailDialog({ open, event, onClose }) {
  const [attData, setAttData] = useState(null);
  const [attLoading, setAttLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && event) {
      const ext = event.extendedProps || {};
      if (ext.status === 'CLOSED' || ext.isPast) {
        setAttLoading(true);
        const endpoint = ext.eventType === 'audit' ? '/api/qms/audit/attendance' : '/api/qms/meeting-attendance';
        const params = { considerDate: 'No', taskScope: 'Company' };
          
        axios.get(endpoint, { params })
          .then(res => {
            let data = Array.isArray(res.data) ? res.data : [];
            if (ext.eventType === 'audit') {
              data = data.filter(d => d.auditScheduleNo === ext.scheduleNo);
            } else {
              data = data.filter(d => d.schedule?.scheduleNo === ext.scheduleNo);
            }
            setAttData(data);
          })
          .catch(err => console.error(err))
          .finally(() => setAttLoading(false));
      } else {
        setAttData(null);
      }
    } else {
      setAttData(null);
    }
  }, [open, event]);

  if (!event) return null;
  const ext = event.extendedProps || {};
  const isMeeting = ext.eventType === 'meeting';
  const isAudit = ext.eventType === 'audit';
  const isInterview = ext.eventType === 'interview';

  const handleOpenInSchedule = () => {
    if (isMeeting) {
      navigate(`/qms/meeting-schedule/edit/${ext.originalId}`);
    } else if (isAudit) {
      navigate(`/qms/audit/schedule/edit/${ext.originalId}`);
    } else if (isInterview) {
      navigate('/hra/ats/interview');
    }
    onClose();
  };

  const accentGradient = isMeeting
    ? 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)'
    : isAudit
    ? 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
    : 'linear-gradient(135deg, #7c4dff 0%, #6200ea 100%)';
  const accentColor = isMeeting ? '#1565c0' : isAudit ? '#c62828' : '#6200ea';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.2)'
          }
        }
      }}
    >
      {/* Visual Top Decorative Banner */}
      <Box
        sx={{
          height: 110,
          background: accentGradient,
          position: 'relative',
          px: 3,
          pt: 2.5,
          color: '#fff',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-40px',
            left: '30%',
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)'
          }
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ zIndex: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '16px',
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}
          >
            {isMeeting ? <IconCalendarEvent size={26} color="#fff" /> : isAudit ? <IconUserCheck size={26} color="#fff" /> : <IconUsers size={26} color="#fff" />}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              {isMeeting ? 'Meeting Schedule' : isAudit ? 'Audit Schedule' : 'Interview Assignment'}
            </Typography>
            <Chip
              label={isMeeting ? ext.meetingType || 'Meeting' : isAudit ? ext.auditType || 'Audit' : `Round: ${ext.round || 'N/A'}`}
              size="small"
              sx={{
                mt: 0.5,
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.68rem',
                backdropFilter: 'blur(4px)'
              }}
            />
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#fff',
            zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
          }}
        >
          <IconX size={20} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, pt: 2.5, bgcolor: '#fafafa' }}>
        <Box sx={{ bgcolor: '#fff', p: 2.5, borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
          {ext.eventType === 'meeting' && <MeetingDetail ext={ext} />}
          {ext.eventType === 'audit' && <AuditDetail ext={ext} />}
          {ext.eventType === 'interview' && <InterviewDetail ext={ext} />}
        </Box>

        {/* ── ATTENDANCE FOR CLOSED SCHEDULES ── */}
        {(ext.status === 'CLOSED' || ext.isPast) && (
          <Box sx={{ mt: 2.5, bgcolor: '#fff', p: 2.5, borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' }}>
            <SectionHeader icon={IconClipboardCheck} title="Attendance Log" color={ext.eventType === 'audit' ? '#c62828' : '#1565c0'} />
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', p: 1.5, minHeight: 60 }}>
              {attLoading ? (
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ height: 40 }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">Fetching attendance...</Typography>
                </Stack>
              ) : attData && attData.length > 0 ? (
                <Stack spacing={1}>
                  {attData.map((att, i) => {
                    const name = ext.eventType === 'audit' ? att.name : att.employee?.employeeName;
                    const status = ext.eventType === 'audit' ? att.attendanceStatus : att.status;
                    const color = status === 'PRESENT' ? 'success' : status === 'LATE' ? 'warning' : 'error';
                    return (
                      <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5, borderBottom: i < attData.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {att.inTime && <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{att.inTime}</Typography>}
                          <Chip label={status || 'ABSENT'} size="small" color={color} sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, borderRadius: '6px' }} />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Stack alignItems="center" justifyContent="center" sx={{ height: 40 }}>
                  <Typography variant="caption" color="text.secondary">No attendance recorded.</Typography>
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #f0f0f0', justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onClose} size="medium" sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
        {ext.originalId && (
          <Button
            variant="contained"
            onClick={handleOpenInSchedule}
            size="medium"
            startIcon={<IconExternalLink size={17} />}
            disabled={!isInterview && ext.isNonEditable}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              background: accentGradient,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': { background: accentGradient, opacity: 0.9 }
            }}
          >
            {isInterview ? 'Go to ATS' : ext.isNonEditable ? 'View Schedule' : 'Edit Schedule'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

ScheduleDetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  event: PropTypes.any,
  onClose: PropTypes.func.isRequired
};
