import { useState, useEffect } from 'react';
import axios from 'utils/axios';
import {
  Card,
  CircularProgress,
  Box,
  Typography,
  Grid,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  Rating
} from '@mui/material';
import {
  IconFileText,
  IconUserCheck,
  IconStar,
  IconCalendar,
  IconUser,
  IconCheck,
  IconX,
  IconThumbUp,
  IconMinus,
  IconArrowDown,
  IconEye,
  IconCurrencyRupee,
  IconClock,
  IconAlertCircle
} from '@tabler/icons-react';
import { getFileViewUrl } from 'utils/upload-helper';
import { BOSStatusChip, BOSPfpAvatar } from 'ui-component/bos';

// Standard feedback marks resolver (percentage calculation)
export const getFeedbackMarks = (feedbackJson) => {
  if (!feedbackJson) return 0;
  try {
    const list = typeof feedbackJson === 'string' ? JSON.parse(feedbackJson) : feedbackJson;
    if (!Array.isArray(list) || list.length === 0) return 0;
    
    let totalScore = 0;
    let count = 0;
    
    list.forEach(item => {
      if (item.score !== undefined && item.score !== null && item.score !== '' && !isNaN(parseFloat(item.score))) {
        totalScore += parseFloat(item.score) * 100;
        count++;
        return;
      }
      
      const val = (item.feedback || '').trim().toLowerCase();
      if (!val) return;
      
      const num = parseFloat(val);
      if (!isNaN(num)) {
        totalScore += num;
        count++;
      } else {
        if (val.includes('excellent') || val.includes('outstanding') || val === 'v.good' || val === 'very good') {
          totalScore += 90;
        } else if (val.includes('good') || val === 'selected' || val === 'pass') {
          totalScore += 75;
        } else if (val.includes('average') || val === 'avg' || val === 'ok' || val === 'hold') {
          totalScore += 50;
        } else if (val.includes('poor') || val.includes('bad') || val === 'rejected' || val === 'fail') {
          totalScore += 25;
        } else {
          totalScore += 50;
        }
        count++;
      }
    });
    return count > 0 ? Math.round(totalScore / count) : 0;
  } catch {
    return 0;
  }
};

// Date formatter helper
export const formatDateStr = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const getRoundStatusChip = (statusStr) => {
  const s = (statusStr || '').toUpperCase().trim();
  if (s === 'SELECTED' || s === 'PASS' || s === 'PASSED' || s === 'APPROVED') {
    return { label: 'SELECTED', color: '#16a34a', bgcolor: '#f0fdf4', border: '#dcfce7', icon: <IconCheck size={10} style={{ color: '#16a34a' }} /> };
  }
  if (s === 'COMPLETED') {
    return { label: 'COMPLETED', color: '#16a34a', bgcolor: '#f0fdf4', border: '#dcfce7', icon: <IconCheck size={10} style={{ color: '#16a34a' }} /> };
  }
  if (s === 'REJECTED') {
    return { label: 'REJECTED', color: '#dc2626', bgcolor: '#fef2f2', border: '#fee2e2', icon: <IconX size={10} style={{ color: '#dc2626' }} /> };
  }
  if (s === 'ON HOLD' || s === 'HOLD' || s === 'ON_HOLD') {
    return { label: 'ON HOLD', color: '#d97706', bgcolor: '#fffbeb', border: '#fef3c7', icon: <IconAlertCircle size={10} style={{ color: '#d97706' }} /> };
  }
  if (s === 'CANCELLED') {
    return { label: 'CANCELLED', color: '#ef4444', bgcolor: '#fef2f2', border: '#fee2e2', icon: <IconX size={10} style={{ color: '#ef4444' }} /> };
  }
  if (s === 'WAITING FOR PROGRESS' || s === 'WAITING FOR PROCESS' || s === 'WAITING_FOR_PROGRESS' || s === 'WAITING_FOR_PROCESS') {
    return { label: 'WAITING FOR PROGRESS', color: '#2563eb', bgcolor: '#eff6ff', border: '#dbeafe', icon: <IconClock size={10} style={{ color: '#2563eb' }} /> };
  }
  return { label: s || 'PENDING', color: '#64748b', bgcolor: '#f1f5f9', border: '#e2e8f0', icon: <IconClock size={10} style={{ color: '#64748b' }} /> };
};

export const isEvaluatedOrActiveInterviewRound = (item, canonicalStatusList = []) => {
  if (!item) return false;

  // 1. Explicit boolean flag check
  if (item.isActive === false || String(item.isActive) === 'false' || String(item.isActive) === '0') {
    return false;
  }

  // 2. Canonical Status ID check (if statusList provided from StatusMaster)
  if (canonicalStatusList && canonicalStatusList.length > 0) {
    const inactiveObj = canonicalStatusList.find(s => String(s.name || s.statusName || '').trim().toUpperCase() === 'INACTIVE');
    const cancelledObj = canonicalStatusList.find(s => String(s.name || s.statusName || '').trim().toUpperCase() === 'CANCELLED');

    if (inactiveObj && (String(item.statusId) === String(inactiveObj.id) || String(item.interviewStatusId) === String(inactiveObj.id))) {
      return false;
    }
    if (cancelledObj && (String(item.statusId) === String(cancelledObj.id) || String(item.interviewStatusId) === String(cancelledObj.id))) {
      return false;
    }
  }

  // 3. Status string & InterviewStatus object / string checks
  const rawStatus = String(item.statusName || item.status || '').trim().toUpperCase();
  if (rawStatus === 'INACTIVE' || rawStatus === 'CANCELLED') {
    return false;
  }

  const ivStatus = typeof item.interviewStatus === 'object' && item.interviewStatus !== null
    ? String(item.interviewStatus.name || item.interviewStatus.statusName || '').trim().toUpperCase()
    : String(item.interviewStatus || '').trim().toUpperCase();

  if (ivStatus === 'CANCELLED' || ivStatus === 'INACTIVE') {
    return false;
  }

  return true;
};

export function EvaluationRoundCard({ round, isSelected, onClick, isDark, theme }) {
  const score = getFeedbackMarks(round.feedbackJson) || 0;
  
  let trackColor = '#10b981'; // Green
  let badgeLabel = 'STRONG';
  let badgeColor = '#16a34a';

  if (score >= 90) {
    badgeLabel = 'OUTSTANDING';
    trackColor = '#10b981';
    badgeColor = '#16a34a';
  } else if (score >= 75) {
    badgeLabel = 'STRONG';
    trackColor = '#10b981';
    badgeColor = '#16a34a';
  } else if (score >= 50) {
    badgeLabel = 'AVERAGE';
    trackColor = '#f59e0b';
    badgeColor = '#d97706';
  } else {
    badgeLabel = 'WEAK';
    trackColor = '#ef4444';
    badgeColor = '#dc2626';
  }

  // Compute dynamic status from interviewProcess / status resolver
  const rawStatus = (round.interviewStatus?.name || round.interviewStatus || round.interviewResult?.name || round.interviewResult || 'PENDING').toString().toUpperCase().trim();
  const chipProps = getRoundStatusChip(rawStatus);

  // Compute evaluated questions
  let qList = [];
  try {
    qList = typeof round.feedbackJson === 'string' ? JSON.parse(round.feedbackJson) : round.feedbackJson;
  } catch {}
  const totalQ = Array.isArray(qList) ? qList.length : 0;
  const answeredQ = Array.isArray(qList) ? qList.filter(item => (item.score !== undefined && item.score !== null && item.score !== '') || (item.feedback && item.feedback.trim() !== '')).length : 0;
  const isEvaluated = answeredQ > 0 || (typeof round.feedbackJson === 'string' && round.feedbackJson.trim().length > 2 && round.feedbackJson.trim() !== '[]');

  // Icon styling
  const rName = (round.round || '').toUpperCase();
  let roundIcon = <IconFileText size={18} />;
  let iconBg = '#e3f2fd';
  let iconColor = theme.palette.primary.main;

  if (rName.includes('TECH')) {
    roundIcon = <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', fontFamily: 'monospace' }}>&lt;/&gt;</Typography>;
    iconBg = '#fdf2f8';
    iconColor = '#db2777';
  } else if (rName.includes('HR')) {
    roundIcon = <IconUserCheck size={18} />;
    iconBg = '#faf5ff';
    iconColor = '#9333ea';
  } else if (rName.includes('MANAGEMENT') || rName.includes('MGR')) {
    roundIcon = <IconStar size={18} />;
    iconBg = '#fff1f2';
    iconColor = '#e11d48';
  }

  const expAmt = parseFloat(round.expSalary);
  const sugAmt = parseFloat(round.suggestedSalary);
  const hasExp = !isNaN(expAmt) && expAmt > 0;
  const hasSug = !isNaN(sugAmt) && sugAmt > 0;
  const isBetter = hasSug && hasExp && sugAmt >= expAmt;
  const fmt = (v) => v.toLocaleString('en-IN');

  const isWatermarked = !isEvaluated && (rawStatus === 'PENDING' || rawStatus.includes('WAITING') || rawStatus === 'CANCELLED' || rawStatus === 'IN PROGRESS');

  return (
    <Card
      variant="outlined"
      onClick={isEvaluated ? onClick : undefined}
      sx={{
        cursor: isEvaluated ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        py: 2,
        px: 2.5,
        borderRadius: '14px',
        width: '100%',
        bgcolor: isDark ? 'dark.800' : '#ffffff',
        border: '1.5px solid',
        borderColor: isSelected ? theme.palette.primary.main : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
        boxShadow: isSelected
          ? (isDark ? '0 6px 18px rgba(34, 87, 191, 0.4)' : '0 6px 18px rgba(34, 87, 191, 0.12)')
          : (isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.03)'),
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr 1fr' },
        alignItems: 'center',
        gap: 3,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        ...(isEvaluated ? {
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: isDark ? 'rgba(34, 87, 191, 0.06)' : 'rgba(34, 87, 191, 0.02)',
            transform: 'translateY(-2px)',
            boxShadow: isDark
              ? '0 8px 24px rgba(34, 87, 191, 0.45)'
              : '0 8px 24px rgba(34, 87, 191, 0.14)'
          }
        } : {})
      }}
    >
      {/* Column 1: Round Info & Interviewer */}
      <Stack spacing={1.5} sx={{ minWidth: 0, opacity: isWatermarked ? 0.75 : 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {roundIcon}
          </Box>
          <Stack spacing={0.2} sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '14px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {round.round}
            </Typography>
            {!isWatermarked && (
              <Chip
                icon={chipProps.icon}
                label={chipProps.label}
                size="small"
                sx={{
                  fontWeight: 800,
                  color: chipProps.color,
                  bgcolor: chipProps.bgcolor,
                  fontSize: '0.55rem',
                  borderRadius: '4px',
                  border: `1px solid ${chipProps.border}`,
                  height: 18,
                  px: 0.2,
                  alignSelf: 'flex-start',
                  '& .MuiChip-icon': { color: `${chipProps.color} !important` }
                }}
              />
            )}
          </Stack>
        </Stack>

        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Interviewer
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {round.interviewPerson || 'N/A'}
          </Typography>
        </Stack>
      </Stack>

      {/* Column 2: Date & Evaluation */}
      <Stack spacing={1.5} sx={{ minWidth: 0, filter: isWatermarked ? 'blur(2.5px)' : 'none', opacity: isWatermarked ? 0.45 : 1, userSelect: isWatermarked ? 'none' : 'auto' }}>
        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Date & Questions
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {isEvaluated
              ? `${formatDateStr(round.interviewDate)} (${answeredQ}/${totalQ > 0 ? totalQ : answeredQ} Qs)`
              : (round.interviewDate ? formatDateStr(round.interviewDate) : '—')}
          </Typography>
        </Stack>

        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Score / Feedback
          </Typography>
          {isEvaluated ? (
            <Typography variant="body2" sx={{ fontWeight: 800, color: badgeColor, fontSize: '13px', whiteSpace: 'nowrap' }}>
              {score}% • {badgeLabel}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '13px', whiteSpace: 'nowrap' }}>
              —
            </Typography>
          )}
        </Stack>
      </Stack>

      {/* Column 3: Salary Package */}
      <Stack spacing={1.5} sx={{ minWidth: 0, filter: isWatermarked ? 'blur(2.5px)' : 'none', opacity: isWatermarked ? 0.45 : 1, userSelect: isWatermarked ? 'none' : 'auto' }}>
        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Expected Salary
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {hasExp ? `₹${fmt(expAmt)}` : (isEvaluated ? 'N/A' : '—')}
          </Typography>
        </Stack>

        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Suggested Salary
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: hasSug ? (isBetter ? '#16a34a' : '#d97706') : 'text.secondary', fontSize: '13px', whiteSpace: 'nowrap' }}>
            {hasSug ? `₹${fmt(sugAmt)}` : (isEvaluated ? 'N/A' : '—')}
          </Typography>
        </Stack>
      </Stack>

      {/* Center Watermark for PENDING / WAITING FOR PROGRESS / CANCELLED */}
      {isWatermarked && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: { xs: 0, sm: '35%' },
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              py: 0.85,
              px: 2.2,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.94)' : 'rgba(239, 246, 255, 0.96)',
              border: `1.5px solid ${chipProps.color}40`,
              boxShadow: isDark
                ? '0 6px 20px rgba(0, 0, 0, 0.5)'
                : '0 6px 20px rgba(37, 99, 235, 0.16)',
              backdropFilter: 'blur(8px)',
              color: chipProps.color
            }}
          >
            {chipProps.icon && (
              <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { width: 16, height: 16, color: `${chipProps.color} !important` } }}>
                {chipProps.icon}
              </Box>
            )}
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.78rem',
                color: chipProps.color,
                letterSpacing: '0.04em',
                lineHeight: 1,
                textTransform: 'uppercase'
              }}
            >
              {chipProps.label}
            </Typography>
          </Box>
        </Box>
      )}
    </Card>
  );
}

export function EvaluationRoundDetailsDialog({
  open,
  onClose,
  round,
  applicant,
  isDark,
  theme,
  departments = [],
  designations = [],
  onViewFile,
  isMobile = false
}) {
  if (!round || !applicant) return null;

  const candidateName = applicant.candidateName || applicant.employeeName || '';
  const candidateCode = applicant.candidateCode || applicant.empCode || applicant.enRolledNo || '';
  const candidatePhoto = applicant.candidatePhoto || applicant.employeePhotoUpload || '';
  const resolvedDeptName = applicant.departmentName || (applicant.department && applicant.department.departmentName) || 'N/A';
  const resolvedDesigName = applicant.designationName || (applicant.designation && applicant.designation.designationName) || applicant.positionLookFor || 'N/A';
  const appliedDate = applicant.appliedDate || applicant.applicantDate || '';
  const currentStatus = applicant.status || applicant.atsOverallStatus || 'APPLIED';

  const rawStatus = (round.interviewStatus?.name || round.interviewStatus || round.interviewResult?.name || round.interviewResult || 'PENDING').toString().toUpperCase().trim();
  const chipProps = getRoundStatusChip(rawStatus);

  const score = getFeedbackMarks(round.feedbackJson) || 0;
  
  const getResultName = (res) => {
    if (!res) return 'PENDING';
    if (typeof res === 'object') {
      return res.name || res.status || 'PENDING';
    }
    return String(res);
  };

  const recommendationName = getResultName(round.interviewResult);
  const isPassed = recommendationName === 'SELECTED' || recommendationName === 'PASSED' || recommendationName === 'PASS';

  let roundPerformance = 'NEED IMPROVEMENT';
  if (score >= 75) {
    roundPerformance = 'OUTSTANDING';
  } else if (score >= 50) {
    roundPerformance = 'AVERAGE';
  } else {
    roundPerformance = 'NEED IMPROVEMENT';
  }

  const getStatusProps = (status) => {
    switch (status) {
      case 'OUTSTANDING':
        return { label: 'OUTSTANDING', color: '#16a34a', bg: '#ecfdf5', border: '#dcfce7', trackColor: '#10b981' };
      case 'AVERAGE':
        return { label: 'AVERAGE', color: '#d97706', bg: '#fffbeb', border: '#fef3c7', trackColor: '#f59e0b' };
      case 'NEED IMPROVEMENT':
      default:
        return { label: 'NEED IMPROVEMENT', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2', trackColor: '#ef4444' };
    }
  };

  const roundPerfProps = getStatusProps(roundPerformance);

  let list = [];
  try {
    list = typeof round.feedbackJson === 'string' ? JSON.parse(round.feedbackJson) : round.feedbackJson;
  } catch {}
  if (!Array.isArray(list)) list = [];

  const isAsked = (item) => {
    const hasScore = item.score !== undefined && item.score !== null && item.score !== '' && !isNaN(parseFloat(item.score));
    const hasFeedback = item.feedback && item.feedback.trim() !== '';
    return hasScore || hasFeedback;
  };

  const getCriteriaStatus = (item) => {
    if (!isAsked(item)) return 'NOT_ASKED';
    if (item.score !== undefined && item.score !== null && item.score !== '' && !isNaN(parseFloat(item.score))) {
      const val = parseFloat(item.score);
      if (val === 1.0) return 'OUTSTANDING';
      if (val === 0.5) return 'AVERAGE';
      return 'NEED IMPROVEMENT';
    } else if (item.feedback) {
      const fb = item.feedback.trim().toUpperCase();
      if (fb.includes('OUTSTANDING') || fb.includes('EXCELLENT') || fb.includes('CORRECT') || fb.includes('STRONG') || fb === 'PASS') {
        return 'OUTSTANDING';
      } else if (fb.includes('AVERAGE') || fb.includes('MODERATE') || fb === 'HOLD' || fb === 'OK') {
        return 'AVERAGE';
      }
    }
    return 'NEED IMPROVEMENT';
  };

  const askedList = list.filter(isAsked);
  const totalCriteria = askedList.length;
  const isEvaluated = askedList.length > 0 || (typeof round.feedbackJson === 'string' && round.feedbackJson.trim().length > 2 && round.feedbackJson.trim() !== '[]');
  const outstandingCount = askedList.filter(item => getCriteriaStatus(item) === 'OUTSTANDING').length;
  const averageCount = askedList.filter(item => getCriteriaStatus(item) === 'AVERAGE').length;
  const needImprovementCount = askedList.filter(item => getCriteriaStatus(item) === 'NEED IMPROVEMENT').length;

  const rName = (round.round || '').toUpperCase();
  let roundIcon = <IconFileText size={20} />;
  let iconBg = '#e3f2fd';
  let iconColor = theme.palette.primary.main;

  if (rName.includes('TECH')) {
    roundIcon = <Typography sx={{ fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace' }}>&lt;/&gt;</Typography>;
    iconBg = '#fdf2f8';
    iconColor = '#db2777';
  } else if (rName.includes('HR')) {
    roundIcon = <IconUserCheck size={20} />;
    iconBg = '#faf5ff';
    iconColor = '#9333ea';
  } else if (rName.includes('MANAGEMENT') || rName.includes('MGR')) {
    roundIcon = <IconStar size={20} />;
    iconBg = '#fff1f2';
    iconColor = '#e11d48';
  }

  // Profile header card variables removed to optimize space as candidate summary is already present in parent window

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          overflow: 'hidden',
          p: 0,
          m: 0,
          bgcolor: 'background.paper'
        }
      }}
    >
      {/* Dynamic Theme Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isDark ? 'background.default' : 'primary.light',
          borderBottom: '1px solid',
          borderColor: isDark ? '#30363d' : 'divider',
          px: 3,
          py: 2,
          m: 0,
          position: 'relative'
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, color: isDark ? '#58a6ff' : 'primary.main', m: 0, textAlign: 'center' }}>
          Evaluation Details - {round.round || ''}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: isDark ? '#8b949e' : 'text.secondary',
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
          }}
        >
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3.5, pt: '28px !important', bgcolor: isDark ? 'dark.900' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: 3.5 }}>

        {/* 2. Round Details Card (Header Information Bar) */}
        <Card variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDark ? 'dark.800' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, flexShrink: 0 }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            {/* Round Name & Icon */}
            <Grid item xs={12} sm={3.5} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: iconBg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                flexShrink: 0
              }}>
                {roundIcon}
              </Box>
              <Stack spacing={0.3}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', m: 0 }}>
                  {round.round || 'Evaluation'}
                </Typography>
                <Chip
                  icon={chipProps.icon}
                  label={chipProps.label}
                  sx={{
                    fontWeight: 800,
                    color: chipProps.color,
                    bgcolor: chipProps.bgcolor,
                    fontSize: '0.65rem',
                    borderRadius: '6px',
                    border: `1px solid ${chipProps.border}`,
                    height: 22,
                    px: 0.5,
                    alignSelf: 'flex-start',
                    '& .MuiChip-icon': {
                      color: `${chipProps.color} !important`
                    }
                  }}
                />
              </Stack>
            </Grid>

            {/* Interview Date */}
            <Grid item xs={6} sm={2} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <IconCalendar size={20} />
              </Box>
              <Stack spacing={0.2}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Interview Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {formatDateStr(round.interviewDate)}
                </Typography>
              </Stack>
            </Grid>

            {/* Interviewer */}
            <Grid item xs={6} sm={2.5} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ color: 'text.secondary' }}>
                <IconUser size={20} />
              </Box>
              <Stack spacing={0.2}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Interviewer
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {round.interviewPerson || 'N/A'}
                </Typography>
              </Stack>
            </Grid>

            {/* Overall Score Circle */}
            <Grid item xs={6} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'center' }, gap: 1.5 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', width: 44, height: 44, flexShrink: 0 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={44}
                  thickness={5}
                  sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={isEvaluated ? score : 0}
                  size={44}
                  thickness={5}
                  sx={{
                    color: isEvaluated ? roundPerfProps.trackColor : '#94a3b8',
                    position: 'absolute',
                    left: 0,
                    strokeLinecap: 'round'
                  }}
                />
                <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.75rem' }}>
                    {isEvaluated ? `${score}%` : '—'}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.2}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  Overall Score
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  {isEvaluated ? `${score}%` : '—'}
                </Typography>
              </Stack>
            </Grid>

            {/* Performance Status */}
            <Grid item xs={6} sm={2} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                Performance
              </Typography>
              <Chip
                label={isEvaluated ? roundPerfProps.label : chipProps.label}
                sx={{
                  fontWeight: 800,
                  color: isEvaluated ? roundPerfProps.color : chipProps.color,
                  bgcolor: isEvaluated ? roundPerfProps.bg : chipProps.bgcolor,
                  border: `1px solid ${isEvaluated ? roundPerfProps.border : chipProps.border}`,
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase'
                }}
              />
            </Grid>
          </Grid>
        </Card>

        {/* 3. Performance Overview */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
            Performance Overview
          </Typography>
          <Card variant="outlined" sx={{ p: 3, borderRadius: '16px', bgcolor: isDark ? 'dark.800' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'stretch',
                width: '100%',
                justifyContent: 'space-between',
                gap: { xs: 3, sm: 0 }
              }}
            >
              {/* Donut Chart */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 20%' },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  pr: { sm: 2 },
                  pb: { xs: 2, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-flex', width: 90, height: 90 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={90}
                    thickness={6}
                    sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={score}
                    size={90}
                    thickness={6}
                    sx={{
                      color: roundPerfProps.trackColor,
                      position: 'absolute',
                      left: 0,
                      strokeLinecap: 'round'
                    }}
                  />
                  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', m: 0, fontSize: '1.35rem' }}>
                      {score}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Total Criteria */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 20%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#eff6ff',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}>
                  <IconFileText size={20} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, textAlign: 'center' }}>
                  Total Criteria
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {totalCriteria}
                </Typography>
              </Box>

              {/* Outstanding */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 20%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: '#ecfdf5',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}>
                  <IconThumbUp size={20} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, textAlign: 'center' }}>
                  Outstanding
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#16a34a' }}>
                  {outstandingCount}
                </Typography>
              </Box>

              {/* Average */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 20%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}>
                  <IconMinus size={20} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, textAlign: 'center' }}>
                  Average
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#d97706' }}>
                  {averageCount}
                </Typography>
              </Box>

              {/* Need Improvement */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 20%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1
                }}>
                  <IconArrowDown size={20} />
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, textAlign: 'center' }}>
                  Need Improvement
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#dc2626' }}>
                  {needImprovementCount}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* 4. Interview Summary */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
            Interview Summary
          </Typography>
          <Card variant="outlined" sx={{ p: 3, borderRadius: '16px', bgcolor: isDark ? 'dark.800' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'stretch',
                width: '100%',
                justifyContent: 'space-between',
                gap: { xs: 3, sm: 0 }
              }}
            >
              {/* Suggested Salary */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 25%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.8, textAlign: 'center' }}>
                  Suggested Salary
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#2257bf' }}>
                  {round.suggestedSalary ? `₹${Number(round.suggestedSalary).toLocaleString('en-IN')}` : 'N/A'}
                </Typography>
              </Box>

              {/* Overall Recommendation */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 25%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.8, textAlign: 'center' }}>
                  Overall Recommendation
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: isPassed ? '#16a34a' : 'text.primary' }}>
                  {recommendationName}
                </Typography>
              </Box>

              {/* Interview Date */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 25%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: { sm: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` },
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.8, textAlign: 'center' }}>
                  Interview Date
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary' }}>
                  {formatDateStr(round.interviewDate)}
                </Typography>
              </Box>

              {/* Interview Summary / Remarks */}
              <Box
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 25%' },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: { sm: 2 },
                  py: { xs: 1, sm: 0 },
                  boxSizing: 'border-box'
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.8, textAlign: 'center' }}>
                  Interview Summary / Remarks
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                  {round.comments || 'No remarks recorded.'}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* 5. Evaluation Criteria list */}
        <Box sx={{ flexShrink: 0 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 2 }}>
            Evaluation Criteria (Asked Questions)
          </Typography>

          {askedList.length > 0 && !isMobile && (
            <Box sx={{
              px: 2.5,
              py: 1.5,
              display: 'grid',
              gridTemplateColumns: '6fr 28fr 18fr 30fr 18fr',
              gap: '16px',
              alignItems: 'center',
              mb: 1
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  #
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Criteria / Question
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Rating
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Candidate Feedback
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Typography sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Attached File
                </Typography>
              </Box>
            </Box>
          )}

          {askedList.length > 0 ? (
            <Stack spacing={2}>
              {askedList.map((item, idx) => {
                const itemPerf = getStatusProps(getCriteriaStatus(item));
                
                const details = item.criteriaDetails || '';
                let title = details;
                let subtitle = '';
                if (details.includes(':')) {
                  const parts = details.split(':');
                  title = parts[0].trim();
                  subtitle = parts.slice(1).join(':').trim();
                } else if (details.includes('-')) {
                  const parts = details.split('-');
                  title = parts[0].trim();
                  subtitle = parts.slice(1).join('-').trim();
                } else if (details.length > 35) {
                  title = details.substring(0, 35) + '...';
                  subtitle = details;
                } else {
                  title = details;
                  subtitle = round.round || 'Evaluation Criteria';
                }

                return (
                  <Card
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      bgcolor: isDark ? 'dark.800' : '#ffffff',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
                    }}
                  >
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '6fr 28fr 18fr 30fr 18fr',
                      gap: '16px',
                      alignItems: 'center'
                    }}>
                      {/* Sl.No */}
                      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' }, alignItems: 'center', minWidth: 0 }}>
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#eff6ff',
                          color: isDark ? '#60a5fa' : 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          {idx + 1}
                        </Box>
                      </Box>

                      {/* Criteria Name & category */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.85rem', overflowWrap: 'anywhere' }}>
                          {title}
                        </Typography>
                        {subtitle && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2, overflowWrap: 'anywhere' }}>
                            {subtitle}
                          </Typography>
                        )}
                      </Box>

                      {/* Rating */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', minWidth: 0 }}>
                        {isMobile && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.3 }}>
                            Rating
                          </Typography>
                        )}
                        <Chip
                          label={itemPerf.label}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            color: itemPerf.color,
                            bgcolor: itemPerf.bg,
                            border: `1px solid ${itemPerf.border}`,
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase'
                          }}
                        />
                      </Box>

                      {/* Candidate Feedback */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                        {isMobile && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.3 }}>
                            Candidate Feedback
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                          {item.feedback || 'No feedback recorded.'}
                        </Typography>
                      </Box>

                      {/* Attached File */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'center', minWidth: 0, width: '100%' }}>
                        {isMobile && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.3 }}>
                            Attached File
                          </Typography>
                        )}
                        {item.attachmentPath ? (() => {
                          const rawName = item.attachmentPath;
                          let decodedName = rawName;
                          try {
                            decodedName = decodeURIComponent(rawName);
                          } catch {}

                          let cleanName = decodedName.replace(/\\/g, '/').split('/').pop();
                          const parts = cleanName.split('_');
                          if (parts.length > 1 && (parts[0].length >= 15 || /^\d+$/.test(parts[0]) || /^[0-9a-fA-F-]+$/.test(parts[0]))) {
                            cleanName = parts.slice(1).join('_');
                          }
                          const displayFileName = cleanName;
                          const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(displayFileName.toLowerCase());

                          return (
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 0.75,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
                              bgcolor: isDark ? 'dark.900' : 'background.paper',
                              position: 'relative',
                              overflow: 'hidden',
                              width: '100%',
                              maxWidth: 220,
                              minWidth: 0,
                              boxSizing: 'border-box'
                            }}>
                              <Box sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: 'success.main' }} />
                              
                              <Box sx={{ 
                                width: 32, 
                                height: 32, 
                                borderRadius: 1, 
                                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'grey.100', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                mr: 1, 
                                flexShrink: 0,
                                overflow: 'hidden'
                              }}>
                                {isImg ? (
                                  <Box
                                    component="img"
                                    src={getFileViewUrl(rawName)}
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <IconFileText size={18} color={theme.palette.text.secondary} />
                                )}
                              </Box>

                              <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                                <Tooltip title={displayFileName} arrow placement="top">
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.72rem',
                                      color: 'text.primary',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: 'block'
                                    }}
                                  >
                                    {displayFileName}
                                  </Typography>
                                </Tooltip>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', opacity: 0.8 }}>
                                  Saved on Server
                                </Typography>
                              </Box>

                              <IconButton 
                                size="small" 
                                color="primary" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onViewFile) {
                                    onViewFile(rawName, displayFileName);
                                  }
                                }} 
                                sx={{ 
                                  flexShrink: 0,
                                  p: 0.5,
                                  bgcolor: isDark ? 'rgba(33, 150, 243, 0.1)' : 'primary.light', 
                                  '&:hover': { bgcolor: 'primary.main', color: 'white' } 
                                }}
                              >
                                <IconEye size={14} />
                              </IconButton>
                            </Box>
                          );
                        })() : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', pr: 2 }}>-</Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          ) : (
            <Card variant="outlined" sx={{
              p: 4,
              borderRadius: '16px',
              bgcolor: isDark ? 'dark.900' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              textAlign: 'center'
            }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
                No criteria evaluation details recorded.
              </Typography>
            </Card>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export function BOSSelfAssessmentViewer({ data, isDark, handleViewDoc }) {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    axios.get('/api/admin/countries')
      .then(res => {
        const activeCountries = (res.data || []).filter(c => c.isActive !== false);
        setCountries(activeCountries);
      })
      .catch(err => console.error('Failed to load countries in BOSSelfAssessmentViewer', err));
  }, []);

  if (!data) return null;

  const selfAssessmentQuestions = [
    {
      group: 'I. PERSONAL & FAMILY DETAILS',
      fields: [
        { name: 'q1_native', nameSnake: 'q1_native', label: '1. Native Place' },
        { name: 'q2_presentAddress', nameSnake: 'q2_present_address', label: '2. Present Address', lg: 12 },
        { name: 'q3_permanentAddress', nameSnake: 'q3_permanent_address', label: '3. Permanent Address', lg: 12 },
        { name: 'q4_fatherOccupation', nameSnake: 'q4_father_occupation', label: "4. Father's Occupation" },
        { name: 'q5_motherOccupation', nameSnake: 'q5_mother_occupation', label: "5. Mother's Occupation" },
        { name: 'q6_maritalStatus', nameSnake: 'q6_marital_status', label: '6. Marital Status' },
        { name: 'q7_spouseOccupation', nameSnake: 'q7_spouse_occupation', label: "7. Occupation of Spouse" },
        { name: 'q8_children', nameSnake: 'q8_children', label: '8. Children' },
        { name: 'q9_hasRelativesInCompany', nameSnake: 'q9_has_relatives', label: '9. Any relative or friends working here?' },
        { name: 'q10_relativesDetails', nameSnake: 'q10_relatives_details', label: '10. Relative or friends details', lg: 12 },
        { name: 'q11_siblingsOccupations', nameSnake: 'q11_siblings_occupations', label: '11. Siblings and their occupations', lg: 12 }
      ]
    },
    {
      group: 'II. GENERAL HABITS, VEHICLE & HEALTH',
      fields: [
        { name: 'q12_hasTwoWheeler', nameSnake: 'q12_has_two_wheeler', label: '12. Do you have two wheeler?' },
        { name: 'q13_hasAndroidPhone', nameSnake: 'q13_has_android_phone', label: '13. Do you have Android phone?' },
        { name: 'q14_knowsCarDriving', nameSnake: 'q14_knows_car_driving', label: '14. Do you know car driving?' },
        { name: 'q15_willingToTravel', nameSnake: 'q15_willing_to_travel', label: '15. Willing to travel?' },
        { name: 'q16_covidVaccination', nameSnake: 'q16_covid_vaccination', label: '16. COVID vaccination with booster?' },
        { name: 'q47_hasInsurance', nameSnake: 'q47_has_insurance', label: '17. Do you have Health / Medical Insurance?' },
        { name: 'q48_insuranceNumber', nameSnake: 'q48_insurance_number', label: '18. Insurance Number / Policy ID' }
      ]
    },
    {
      group: 'III. PERSONAL GOALS & REFLECTION',
      fields: [
        { name: 'q17_positivePoints', nameSnake: 'q17_positive_points', label: '17. Brief about positive points', lg: 12 },
        { name: 'q18_negativePoints', nameSnake: 'q18_negative_points', label: '18. Brief about negative points', lg: 12 },
        { name: 'q19_lifeGoals', nameSnake: 'q19_life_goals', label: "19. Life goals & action plan", lg: 12 },
        { name: 'q20_willingRotationalShifts', nameSnake: 'q20_willing_rotational_shifts', label: '20. Willing to work in rotational shifts', lg: 12 }
      ]
    },
    {
      group: 'IV. CAREER, SALARY & BENEFITS',
      fields: [
        { name: 'q21_isExperienced', nameSnake: 'q21_is_experienced', label: '21. Experienced?' },
        { name: 'q22_totalExperience', nameSnake: 'q22_total_experience', label: '22. Total years of experience' },
        { name: 'q23_coreExperience', nameSnake: 'q23_core_experience', label: '23. Core department experience years' },
        { name: 'q24_prevNetSalary', nameSnake: 'q24_prev_net_salary', label: '24. Previous Net Salary' },
        { name: 'q25_prevGrossSalary', nameSnake: 'q25_prev_gross_salary', label: '25. Previous Gross Salary' },
        { name: 'q26_expectedNetSalary', nameSnake: 'q26_expected_net_salary', label: '26. Expected Net Salary' },
        { name: 'q27_expectedGrossSalary', nameSnake: 'q27_expected_gross_salary', label: '27. Expected Gross Salary' },
        { name: 'q30_alternativeDepartment', nameSnake: 'q30_alternative_department', label: '28. Alternate department interest' }
      ]
    },
    {
      group: 'V. PREVIOUS EMPLOYMENT DETAILS',
      fields: [
        { name: 'q31_prevLocation', nameSnake: 'q31_prev_location', label: '29. Previous/current company location' },
        { name: 'q32_prevShift', nameSnake: 'q32_prev_shift', label: '30. Previously worked shift' },
        { name: 'q33_reasonForLeaving', nameSnake: 'q33_reason_for_leaving', label: '31. Reason for leaving previous job', lg: 12 },
        { name: 'q34_noticePeriod', nameSnake: 'q34_notice_period', label: '32. Notice period (days)' },
        { name: 'q35_prevDeptPosition', nameSnake: 'q35_prev_dept_position', label: '33. Prev dept and position details', lg: 12 },
        { name: 'q36_prevDeptCount', nameSnake: 'q36_prev_dept_count', label: '34. Prev dept employee count' }
      ]
    },
    {
      group: 'VI. BEHAVIORAL & WORK RATINGS',
      fields: [
        { name: 'q38_handleMistake', nameSnake: 'q38_handle_mistake', label: '36. How you handle mistakes', lg: 12 },
        { name: 'q39_handleOpinionDifference', nameSnake: 'q39_handle_opinion_difference', label: '37. Handle team opinion differences', lg: 12 },
        { name: 'q40_computerSelfRating', nameSnake: 'q40_computer_self_rating', label: '38. Self rating (MS-Office, Outlook)', rating: true },
        { name: 'payslip', nameSnake: 'payslipPath', label: 'PAY SLIP', type: 'file' }
      ]
    }
  ];

  const getVal = (f) => {
    if (data[f.name] !== undefined && data[f.name] !== null) return data[f.name];
    if (data[f.nameSnake] !== undefined && data[f.nameSnake] !== null) return data[f.nameSnake];
    return '';
  };

  const getExperiencedVal = () => {
    if (data.q21_isExperienced !== undefined) return data.q21_isExperienced;
    if (data.q21_is_experienced !== undefined) return data.q21_is_experienced;
    return '';
  };

  const getPfPensionVal = () => {
    if (data.q28_pfHigherPension !== undefined) return data.q28_pfHigherPension;
    if (data.q28_pf_higher_pension !== undefined) return data.q28_pf_higher_pension;
    return '';
  };

  return (
    <Stack spacing={3.5}>
      {selfAssessmentQuestions.map((g, gIdx) => {
        if (g.group === 'V. PREVIOUS EMPLOYMENT DETAILS' && getExperiencedVal() !== 'YES') {
          return null;
        }
        return (
          <Card
            key={gIdx}
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: isDark ? 'dark.800' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
              flexShrink: 0
            }}
          >
            <Typography variant="h4" color="primary" sx={{ mb: 3, fontWeight: 700, borderBottom: '2.5px solid #e2e8f0', pb: 1.5, letterSpacing: '0.01em' }}>
              {g.group}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: 2.25,
                width: '100%'
              }}
            >
              {g.fields.map(f => {
                if (f.dependentOn && getPfPensionVal() !== f.dependentValue) {
                  return null;
                }
                const val = getVal(f);
                const isSpecial = f.type === 'file' || f.rating;
                const gridSpan = isSpecial
                  ? { xs: 'span 1', sm: 'span 2', md: 'span 3' }
                  : 'span 1';

                return (
                  <Box
                    key={f.name}
                    sx={{
                      gridColumn: gridSpan,
                      width: '100%'
                    }}
                  >
                    {f.type === 'file' ? (
                      <Box
                        sx={{
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                          borderRadius: '6px',
                          p: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          minHeight: '52px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5
                          }}
                        >
                          {f.label}
                        </Typography>
                        {val && (typeof val === 'object' ? val.serverFileName : val) ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 0.5,
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'background.paper',
                              maxWidth: '100%',
                              minWidth: 260
                            }}
                          >
                            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <IconFileText size={18} color="#2196f3" />
                            </Box>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap title={typeof val === 'object' ? val.fileName : val.split('/').pop()}>
                                {typeof val === 'object' ? val.fileName : val.split('/').pop()}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label="Saved" size="small" color="success" variant="outlined" sx={{ height: 16, fontSize: '0.55rem', fontWeight: 700 }} />
                              </Stack>
                            </Box>
                            {handleViewDoc && (
                              <IconButton
                                size="small"
                                onClick={() => handleViewDoc(typeof val === 'object' ? val.serverFileName : val, typeof val === 'object' ? val.fileName : val.split('/').pop())}
                                sx={{ color: 'primary.main', bgcolor: 'rgba(33, 150, 243, 0.08)', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                                title="Preview Document"
                              >
                                <IconEye size={16} />
                              </IconButton>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontStyle: 'italic' }}>
                            No file uploaded
                          </Typography>
                        )}
                      </Box>
                    ) : f.rating ? (
                      <Box
                        sx={{
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                          borderRadius: '6px',
                          p: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          minHeight: '52px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5
                          }}
                        >
                          {f.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Rating
                            max={5}
                            value={
                              val === 'EXCELLENT' ? 5 :
                              val === 'VERY GOOD' ? 4 :
                              val === 'GOOD' ? 3 :
                              val === 'AVERAGE' ? 2 :
                              val === 'POOR' ? 1 : 0
                            }
                            readOnly
                            size="medium"
                          />
                          <Chip
                            label={val || 'N/A'}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
                          borderRadius: '6px',
                          p: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          minHeight: '52px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            mb: 0.5
                          }}
                        >
                          {f.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isDark ? '#f1f5f9' : '#1e293b',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.3
                          }}
                        >
                          {val || '-'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {g.group === 'V. PREVIOUS EMPLOYMENT DETAILS' && (
              <Stack spacing={2.5} sx={{ mt: 3, width: '100%' }}>
                {/* HR Manager Reference Details */}
                <Box sx={{ p: 2.5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                    HR Manager Reference Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                      gap: 2.5,
                      width: '100%'
                    }}
                  >
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        HR Manager Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {data.q41_hrMgrName || data.q41_hr_mgr_name || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        HR Manager Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {data.q42_hrMgrEmail || data.q42_hr_mgr_email || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        HR Manager Country
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {(() => {
                          const countryId = data.q43_hrMgrCountryId || data.q43_hr_mgr_country_id;
                          const c = (countries || []).find(x => String(x.id) === String(countryId));
                          return c ? `${c.countryName} (${c.isd})` : '-';
                        })()}
                      </Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        HR Manager Phone
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {data.q43_hrMgrPhone || data.q43_hr_mgr_phone || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Vertical Head Reference Details */}
                <Box sx={{ p: 2.5, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
                    Vertical Head Reference Details
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                      gap: 2.5,
                      width: '100%'
                    }}
                  >
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Vertical Head Name
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {data.q44_vertHeadName || data.q44_vert_head_name || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Vertical Head Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {data.q45_vertHeadEmail || data.q45_vert_head_email || '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Vertical Head Country
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {(() => {
                          const countryId = data.q46_vertHeadCountryId || data.q46_vert_head_country_id;
                          const c = (countries || []).find(x => String(x.id) === String(countryId));
                          return c ? `${c.countryName} (${c.isd})` : '-';
                        })()}
                      </Typography>
                    </Box>
                    <Box sx={{ borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Vertical Head Phone
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {data.q46_vertHeadPhone || data.q46_vert_head_phone || '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            )}
          </Card>
        );
      })}
    </Stack>
  );
}

/**
 * Checks if interview criteria are configured.
 * Returns an object with valid (boolean) and message (string).
 */
export const checkInterviewCriteriaConfigured = (criteriaList) => {
  if (!criteriaList || criteriaList.length === 0) {
    return {
      valid: false,
      message: "There are no interview criteria configured for this candidate's department and designation level. Please configure Interview Criteria Master before proceeding."
    };
  }
  return { valid: true };
};

/**
 * Validates the 3:1 criteria completion rule: at least 1 question must be graded for every 3 master criteria.
 */
export const validateInterviewCompletionRatio = (criteriaList) => {
  const list = criteriaList || [];
  const masterCriteriaList = list.filter(item => item.isMasterCriteria);
  const totalMasterCriteria = masterCriteriaList.length;
  if (totalMasterCriteria > 0) {
    const minRequiredToAsk = Math.ceil(totalMasterCriteria / 3);
    const askedCount = masterCriteriaList.filter(item => item.score !== null && item.score !== undefined && item.score !== '').length;
    if (askedCount < minRequiredToAsk) {
      return {
        valid: false,
        message: `Minimum criteria limit not met. You must grade at least ${minRequiredToAsk} out of the ${totalMasterCriteria} criteria questions.`
      };
    }
  }
  return { valid: true };
}

