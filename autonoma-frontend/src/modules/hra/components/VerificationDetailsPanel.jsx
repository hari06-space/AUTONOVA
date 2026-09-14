import React from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Chip,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  IconButton,
  Rating,
  useTheme
} from '@mui/material';
import {
  IconShieldCheck,
  IconEye,
  IconAlertCircle
} from '@tabler/icons-react';
import { BOSStatusChip, BOSTextField } from 'ui-component/bos';

const GridContainer = ({ children, columns = { xs: 1, sm: 2, md: 3 } }) => {
  const templateColumns = typeof columns === 'object'
    ? { xs: `repeat(${columns.xs || 1}, 1fr)`, sm: `repeat(${columns.sm || 2}, 1fr)`, md: `repeat(${columns.md || 3}, 1fr)` }
    : `repeat(${columns}, 1fr)`;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: templateColumns, gap: 2.5, width: '100%' }}>
      {children}
    </Box>
  );
};

const R = ({ children, lg }) => {
  let gridColumn = 'span 1';
  if (lg === 6) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 8) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 2' };
  if (lg === 12) gridColumn = { xs: 'span 1', sm: 'span 2', md: 'span 3' };
  return <Box sx={{ gridColumn, width: '100%' }}>{children}</Box>;
};

export default function VerificationDetailsPanel({
  formData = {},
  originalData = {},
  verificationReviews = null,
  verificationLoading = false,
  assessmentData = {},
  handleViewDoc,
  isDark = false
}) {
  const theme = useTheme();

  // Extract overall BGV status
  const getStatusName = (val) => {
    if (!val) return 'PENDING';
    if (typeof val === 'object') return val.name || val.status || 'PENDING';
    return String(val);
  };



  // Verifier Heads Data
  const reportingManagerData = verificationReviews?.reporting_manager;
  const verticalHeadData = verificationReviews?.vertical_head;
  const hrManualData = verificationReviews?.hr_manual;

  // Determine applicable heads
  const hasReportingManager = Boolean(
    reportingManagerData && (
      reportingManagerData.name ||
      reportingManagerData.email ||
      reportingManagerData.isSubmitted ||
      (reportingManagerData.reviews && reportingManagerData.reviews.length > 0) ||
      assessmentData?.q41_hrMgrName ||
      assessmentData?.q42_hrMgrEmail
    )
  );

  const hasVerticalHead = Boolean(
    verticalHeadData && (
      verticalHeadData.name ||
      verticalHeadData.email ||
      verticalHeadData.isSubmitted ||
      (verticalHeadData.reviews && verticalHeadData.reviews.length > 0) ||
      assessmentData?.q44_vertHeadName ||
      assessmentData?.q45_vertHeadEmail
    )
  );

  const hasHrManual = Boolean(
    hrManualData && (
      hrManualData.isSubmitted ||
      (hrManualData.reviews && hrManualData.reviews.length > 0)
    )
  );

  // Document verification statuses & rejections
  const photoStatus = getStatusName(originalData?.photoVerifiedStatus);
  const resumeStatus = getStatusName(originalData?.resumeVerifiedStatus);
  const aadharStatus = getStatusName(originalData?.aadharVerifiedStatus);
  const payslipStatus = getStatusName(originalData?.payslipVerifiedStatus);

  const photoReason = originalData?.photoRejectReason || '';
  const resumeReason = originalData?.resumeRejectReason || '';
  const aadharReason = originalData?.aadharRejectReason || '';
  const payslipReason = originalData?.payslipRejectReason || '';

  const hasDocVerificationData = Boolean(
    photoReason || resumeReason || aadharReason || payslipReason ||
    ['APPROVED', 'REJECTED', 'VERIFIED', 'TO BE VERIFIED'].includes(String(photoStatus).toUpperCase()) ||
    ['APPROVED', 'REJECTED', 'VERIFIED', 'TO BE VERIFIED'].includes(String(resumeStatus).toUpperCase())
  );

  // Final Verification Decision & Comments
  const finalComments = originalData?.referenceComments || originalData?.comments || formData?.refComments || formData?.cancellationReason || '';
  const bgvAuditRemark = originalData?.bgvRemark || formData?.bgvRemark || '';

  if (verificationLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderVerifierHeadCard = (headData, title, fallbackName, fallbackEmail, fallbackPhone) => {
    const name = headData?.name || fallbackName || 'Not Assigned';
    const email = headData?.email || fallbackEmail || '-';
    const phone = headData?.phone || fallbackPhone || '-';
    const isSubmitted = Boolean(headData?.isSubmitted);
    const submittedDate = headData?.submittedDate ? new Date(headData.submittedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    const reviews = headData?.reviews || [];

    const headStatus = isSubmitted ? 'VERIFIED' : (reviews.length > 0 ? 'PARTIAL VERIFICATION' : 'TO BE VERIFIED');

    return (
      <Card
        variant="outlined"
        key={title}
        sx={{
          borderRadius: '16px',
          bgcolor: isDark ? 'dark.800' : '#ffffff',
          borderColor: 'divider',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box
          sx={{
            bgcolor: isDark ? 'dark.900' : '#f8fafc',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              label={title}
              size="small"
              sx={{
                fontWeight: 800,
                borderRadius: '6px',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                color: isDark ? '#a5b4fc' : '#4f46e5'
              }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {name}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Submitted: {submittedDate}
            </Typography>
            <BOSStatusChip status={headStatus} showIcon width={160} />
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Verifier Info Row */}
          <GridContainer columns={{ xs: 1, sm: 3, md: 3 }}>
            <R>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>VERIFIER NAME</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{name}</Typography>
              </Stack>
            </R>
            <R>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>EMAIL ADDRESS</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{email}</Typography>
              </Stack>
            </R>
            <R>
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>PHONE NUMBER</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{phone}</Typography>
              </Stack>
            </R>
          </GridContainer>

          {/* Reviews List */}
          {reviews.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="caption" sx={{ fontWeight: 750, color: 'text.secondary', letterSpacing: '0.5px', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                Verification Criteria & Ratings
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: isDark ? 'dark.900' : '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: '40%' }}>Criterion / Detail Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '25%' }}>Rating / Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: '35%' }}>Comments / Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviews.map((r, rIdx) => (
                      <TableRow key={rIdx}>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {r.question || `Criterion ${r.questionId || rIdx + 1}`}
                        </TableCell>
                        <TableCell>
                          {r.rating ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Rating value={Number(r.rating)} readOnly size="small" precision={1} />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>({r.rating}/5)</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {r.feedback || r.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  return (
    <Stack spacing={2.5} sx={{ width: '100%' }}>

      {/* Verification Heads / Records (Side-by-side 2 Columns) */}
      {(hasReportingManager || hasVerticalHead || hasHrManual) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, width: '100%' }}>
          {hasReportingManager && renderVerifierHeadCard(
            reportingManagerData,
            'Reporting Manager Verification',
            assessmentData?.q41_hrMgrName,
            assessmentData?.q42_hrMgrEmail,
            assessmentData?.q43_hrMgrPhone
          )}

          {hasVerticalHead && renderVerifierHeadCard(
            verticalHeadData,
            'Vertical Head Verification',
            assessmentData?.q44_vertHeadName,
            assessmentData?.q45_vertHeadEmail,
            assessmentData?.q46_vertHeadPhone
          )}

          {hasHrManual && renderVerifierHeadCard(
            hrManualData,
            'HR Manual Verification',
            'HR Team',
            '',
            ''
          )}
        </Box>
      )}

      {!hasReportingManager && !hasVerticalHead && !hasHrManual && (
        <Card variant="outlined" sx={{ borderRadius: '16px', p: 4, textAlign: 'center', bgcolor: isDark ? 'dark.800' : '#ffffff' }}>
          <IconAlertCircle size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            No Referee Verification Responses Received
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            Background verification link has not been completed by the candidate's referees yet.
          </Typography>
        </Card>
      )}
      {/* Bottom Read-Only Comments & Audit Remarks */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: '16px',
          bgcolor: isDark ? 'dark.800' : '#ffffff',
          borderColor: 'divider',
          p: 3,
          mt: 2.5
        }}
      >
        <GridContainer columns={{ xs: 1, sm: 2, md: 2 }}>
          <R>
            <BOSTextField
              label="General Comments"
              multiline
              rows={3}
              fullWidth
              size="small"
              value={finalComments || ''}
              InputProps={{ readOnly: true }}
            />
          </R>
          <R>
            <BOSTextField
              label="BGV Audit Remark"
              multiline
              rows={3}
              fullWidth
              size="small"
              value={bgvAuditRemark || ''}
              InputProps={{ readOnly: true }}
            />
          </R>
        </GridContainer>
      </Card>
    </Stack>
  );
}
