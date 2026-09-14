import { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Button,
  Stack,
  Box,
  Card,
  CardContent,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  CircularProgress
} from '@mui/material';
import axios from 'utils/axios';
import { IconMoodSmile, IconDeviceFloppy, IconX, IconAlertCircle, IconArrowLeft, IconClipboardCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField, btnCancel } from 'ui-component/bos';

const RATINGS = [
  { label: 'EXCELLENT', score: 100, color: '#22C55E', emoji: '⭐' },
  { label: 'VERY GOOD', score: 75, color: '#10B981', emoji: '😊' },
  { label: 'GOOD', score: 50, color: '#3B82F6', emoji: '🙂' },
  { label: 'MODERATE', score: 25, color: '#F59E0B', emoji: '😐' },
  { label: 'POOR', score: 0, color: '#EF4444', emoji: '☹' }
];

const SURVEY_CONFIGS = {
  employee: {
    questionsUrl: '/api/hra/employee-satisfaction/questions',
    submitUrl: '/api/hra/employee-satisfaction/submit',
    pendingUrl: '/api/hra/employee-satisfaction/my-pending',
    title: 'Employee Satisfaction Survey',
    header: 'Employee Satisfaction Feedback',
    entityLabel: 'Employee',
    bgGradient: 'radial-gradient(circle, #1e1b4b 0%, #030712 100%)',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    description: 'Your feedback matters. Please share your genuine ratings. Comments are mandatory for Moderate or Poor ratings.'
  },
  vendor: {
    questionsUrl: '/api/qms/vendor-satisfaction/questions',
    submitUrl: '/api/qms/vendor-satisfaction/submit',
    pendingUrl: '/api/qms/vendor-satisfaction/my-pending',
    title: 'Vendor Satisfaction Survey',
    header: 'Vendor Satisfaction Feedback',
    entityLabel: 'Vendor',
    bgGradient: 'radial-gradient(circle, #0f172a 0%, #020617 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    description: 'Please rate our collaboration. Specific comments are mandatory for Moderate or Poor ratings.'
  },
  customer: {
    questionsUrl: '/api/antigravity/customer-feedback/questions',
    submitUrl: '/api/antigravity/customer-feedback/submit',
    pendingUrl: '/api/antigravity/customer-feedback/my-pending',
    title: 'Customer Satisfaction Survey',
    header: 'Customer Satisfaction Feedback',
    entityLabel: 'Customer',
    bgGradient: 'radial-gradient(circle, #172554 0%, #020617 100%)',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    description: 'Please share your experience with our services. Specific comments are mandatory for Moderate or Poor ratings.'
  },
  internal: {
    questionsUrl: '/api/qms/internal-customer-satisfaction/questions',
    submitUrl: '/api/qms/internal-customer-satisfaction/submit',
    pendingUrl: '/api/qms/internal-customer-satisfaction/my-pending',
    title: 'Internal Customer Satisfaction Survey',
    header: 'Internal Customer Satisfaction Feedback',
    entityLabel: 'Internal Customer',
    bgGradient: 'radial-gradient(circle, #2e1065 0%, #020617 100%)',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    description: 'Please rate the services of other departments. Specific comments are mandatory for Moderate or Poor ratings.'
  }
};

export default function EmployeeFeedbackPortal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pendingMapping, setPendingMapping] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [surveyType, setSurveyType] = useState('employee');
  const [entityName, setEntityName] = useState('');
  
  // Form responses
  const [answers, setAnswers] = useState({});
  const [suggestions, setSuggestions] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const activeConfig = SURVEY_CONFIGS[surveyType];

  // Fetch pending feedback mapping and active satisfaction questions
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const urlMappingId = queryParams.get('mappingId');

      let currentMapping = null;
      let type = 'employee';

      const checkRes = await axios.get('/api/pending-feedback-check');
      const checkData = checkRes.data || {};

      if (urlMappingId) {
        if (checkData.employee?.pending && String(checkData.employee.mappingId) === String(urlMappingId)) {
          type = 'employee';
        } else if (checkData.vendor?.pending && String(checkData.vendor.mappingId) === String(urlMappingId)) {
          type = 'vendor';
        } else if (checkData.customer?.pending && String(checkData.customer.mappingId) === String(urlMappingId)) {
          type = 'customer';
        } else if (checkData.internal?.pending && String(checkData.internal.mappingId) === String(urlMappingId)) {
          type = 'internal';
        } else {
          // If no match but mappingId exists, check which one is pending as fallback
          if (checkData.employee?.pending) type = 'employee';
          else if (checkData.vendor?.pending) type = 'vendor';
          else if (checkData.customer?.pending) type = 'customer';
          else if (checkData.internal?.pending) type = 'internal';
        }
      } else {
        // No mappingId: find first pending survey from consolidated check
        if (checkData.employee?.pending) {
          type = 'employee';
        } else if (checkData.vendor?.pending) {
          type = 'vendor';
        } else if (checkData.customer?.pending) {
          type = 'customer';
        } else if (checkData.internal?.pending) {
          type = 'internal';
        }
      }

      setSurveyType(type);
      const config = SURVEY_CONFIGS[type];

      let entityNameVal = '';
      if (type === 'employee') {
        entityNameVal = checkData.employee?.employeeName || '';
      } else if (type === 'customer') {
        entityNameVal = checkData.customer?.customerName || '';
      } else if (type === 'vendor') {
        entityNameVal = checkData.vendor?.vendorName || '';
      } else if (type === 'internal') {
        entityNameVal = checkData.internal?.employeeName || '';
      }

      // Load pending details
      try {
        const mapRes = await axios.get(config.pendingUrl);
        const mappings = mapRes.data || [];
        let found = null;
        if (urlMappingId) {
          found = mappings.find(m => String(m.mappingId || m.id) === String(urlMappingId));
        }
        if (!found && mappings.length > 0) {
          found = mappings[0];
        }
        if (found) {
          currentMapping = {
            mappingId: found.mappingId || found.id,
            feedbackCycle: found.feedbackCycle || 'June 2026',
            status: found.status || 'Pending'
          };
          if (!entityNameVal) {
            entityNameVal = found.employeeName || found.customerName || found.vendorName || '';
          }
        } else if (urlMappingId) {
          currentMapping = {
            mappingId: urlMappingId,
            feedbackCycle: 'June 2026',
            status: 'Pending'
          };
        }
      } catch (err) {
        if (urlMappingId) {
          currentMapping = {
            mappingId: urlMappingId,
            feedbackCycle: 'June 2026',
            status: 'Pending'
          };
        }
      }

      setEntityName(entityNameVal);

      if (currentMapping) {
        setPendingMapping(currentMapping);

        // Get questions
        const qRes = await axios.get(config.questionsUrl);
        setQuestions(qRes.data || []);

        // Initialize empty answers
        const initialAnswers = {};
        (qRes.data || []).forEach((q) => {
          initialAnswers[q.id] = {
            rating: '',
            score: 0,
            comments: ''
          };
        });
        setAnswers(initialAnswers);
      } else {
        setPendingMapping(null);
      }
    } catch (e) {
      console.error('Error loading feedback portal data', e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Error loading feedback questions.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRatingChange = (qId, ratingValue) => {
    const selected = RATINGS.find((r) => r.label === ratingValue);
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        rating: ratingValue,
        score: selected ? selected.score : 0
      }
    }));
  };

  const handleCommentChange = (qId, commentValue) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        comments: commentValue
      }
    }));
  };

  const handleClear = () => {
    const cleared = {};
    questions.forEach((q) => {
      cleared[q.id] = {
        rating: '',
        score: 0,
        comments: ''
      };
    });
    setAnswers(cleared);
    setSuggestions('');
    setGeneralComments('');
  };

  const handleSubmit = async () => {
    // Validate that all questions have a rating selected and that Moderate/Poor comments are provided
    const uncompleted = [];
    const missingComments = [];
    questions.forEach((q) => {
      const ans = answers[q.id];
      if (!ans || !ans.rating) {
        uncompleted.push(q);
      } else if (['Moderate', 'Poor', 'MODERATE', 'POOR'].includes(ans.rating)) {
        if (!ans.comments || !ans.comments.trim()) {
          missingComments.push(q);
        }
      }
    });

    if (uncompleted.length > 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: `Please rate all ${questions.length} questions before submitting.`,
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    if (missingComments.length > 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Moderate and Poor comments are mandatory. Please provide a comment for all highlighted responses.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const responsePayload = questions.map((q) => ({
        questionId: q.id,
        rating: answers[q.id].rating,
        score: answers[q.id].score,
        comments: answers[q.id].comments
      }));

      const payload = {
        mappingId: pendingMapping.mappingId,
        generalComments,
        suggestions,
        responses: responsePayload
      };

      await axios.post(activeConfig.submitUrl, payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Feedback submitted successfully! Thank you for your response.',
          variant: 'alert',
          severity: 'success'
        })
      );

      // Transition to Thank You state
      setIsSubmitted(true);
      setPendingMapping(null);
    } catch (e) {
      console.error('Error submitting feedback', e);
      dispatch(
        openSnackbar({
          open: true,
          message: e.response?.data?.message || 'Failed to submit feedback survey.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const completionPercentage = useMemo(() => {
    if (questions.length === 0) return 0;
    const completedCount = Object.values(answers).filter((a) => a.rating).length;
    return Math.round((completedCount / questions.length) * 100);
  }, [answers, questions]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (isSubmitted) {
    return (
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconMoodSmile size={24} style={{ color: '#4caf50' }} />
            <Typography variant="h3">{activeConfig.header}</Typography>
          </Stack>
        }
      >
        <Stack alignItems="center" spacing={2} sx={{ p: 4, textAlign: 'center' }}>
          <IconMoodSmile size={64} style={{ color: '#4caf50' }} />
          <Typography variant="h2" sx={{ fontWeight: 700, color: '#0F172A' }}>Thank You!</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px' }}>
            Your feedback has been successfully submitted and updated in the database. Thank you for taking the time to share your response with us!
          </Typography>
          <Button
            onClick={() => navigate('/')}
            startIcon={<IconArrowLeft size={18} />}
            sx={{ ...btnCancel, mt: 2 }}
          >
            Back
          </Button>
        </Stack>
      </MainCard>
    );
  }

  if (!pendingMapping) {
    return (
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconMoodSmile size={24} style={{ color: '#4caf50' }} />
            <Typography variant="h3">{activeConfig.header}</Typography>
          </Stack>
        }
      >
        <Stack alignItems="center" spacing={2} sx={{ p: 4, textAlign: 'center' }}>
          <IconMoodSmile size={64} style={{ color: '#4caf50' }} />
          <Typography variant="h2">No Feedback Assigned</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px' }}>
            There are currently no active {activeConfig.title.toLowerCase()}s awaiting your feedback. Surveys are assigned automatically based on active cycles.
          </Typography>
          <Button
            onClick={() => navigate('/')}
            startIcon={<IconArrowLeft size={18} />}
            sx={{ ...btnCancel, mt: 2 }}
          >
            Back
          </Button>
        </Stack>
      </MainCard>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '80vh',
        bgcolor: 'background.paper',
        borderRadius: 0,
        p: 0,
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pb: 12
      }}
    >
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Weightless Progress Tracker */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#475569' }}>
            Cycle: {pendingMapping.feedbackCycle}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 750, color: '#1976d2' }}>
            {completionPercentage}% Completed
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: '3px', bgcolor: 'rgba(0, 0, 0, 0.06)', borderRadius: '2.5px', position: 'relative', overflow: 'visible', mb: 4.5 }}>
          <Box
            sx={{
              width: `${completionPercentage}%`,
              height: '100%',
              bgcolor: '#1976d2',
              borderRadius: '2.5px',
              transition: 'width 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}
          />
        </Box>

        {/* Header Banner */}
        <Box
          sx={{
            background: 'linear-gradient(90deg, #e6f0ff 0%, #f8fafc 100%)',
            border: '1px solid rgba(33, 150, 243, 0.15)',
            borderRadius: '16px',
            p: 3,
            mb: 4.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            boxShadow: '0 4px 20px rgba(33, 150, 243, 0.05)'
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
              borderRadius: '16px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(33, 150, 243, 0.25)',
              flexShrink: 0
            }}
          >
            <IconClipboardCheck size={28} color="#ffffff" />
          </Box>
          <Box>
            <Typography variant="h1" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '1.45rem', mb: 0.5, fontFamily: '"Inter", "Roboto", sans-serif' }}>
              {entityName ? `${activeConfig.title} - ${entityName}` : activeConfig.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem', fontFamily: '"Inter", "Roboto", sans-serif' }}>
              Submit feedback and evaluation ratings
            </Typography>
          </Box>
        </Box>

        {/* Question list */}
        <Stack spacing={3.5} sx={{ width: '100%' }}>
          {questions.map((q, idx) => (
            <Box
              key={q.id}
              sx={{
                background: 'background.paper',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '16px',
                p: 3.5,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.3s ease'
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#0F172A', mb: 2.5, fontSize: '1.05rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ marginRight: '8px' }}>{idx + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: q?.satisfactionCriteria || '' }} />
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                {RATINGS.map((r) => {
                  const isSelected = answers[q.id]?.rating === r.label;
                  const ratingColor = r.color;
                  let glowColor = 'rgba(34, 197, 94, 0.2)';
                  if (r.label === 'MODERATE') glowColor = 'rgba(245, 158, 11, 0.2)';
                  if (r.label === 'POOR') glowColor = 'rgba(239, 68, 68, 0.2)';
                  if (r.label === 'GOOD') glowColor = 'rgba(59, 130, 246, 0.2)';
                  if (r.label === 'VERY GOOD') glowColor = 'rgba(16, 185, 129, 0.2)';

                  return (
                    <Box
                      key={r.label}
                      onClick={() => handleRatingChange(q.id, r.label)}
                      sx={{
                        flex: 1,
                        textAlign: 'center',
                        cursor: 'pointer',
                        py: 1.25,
                        px: 2,
                        borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: isSelected ? ratingColor : 'rgba(0, 0, 0, 0.08)',
                        bgcolor: isSelected ? `${ratingColor}10` : '#FFFFFF',
                        color: isSelected ? ratingColor : '#475569',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? `0 0 12px ${glowColor}` : 'none',
                        transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        userSelect: 'none',
                        minWidth: '105px',
                        '&:hover': {
                          transform: isSelected ? 'scale(1.05)' : 'scale(1.02)',
                          bgcolor: isSelected ? `${ratingColor}15` : 'rgba(0, 0, 0, 0.02)',
                          borderColor: isSelected ? ratingColor : 'rgba(0, 0, 0, 0.2)'
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {r.emoji} {r.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Smooth Floating Out comments slider */}
              <Box
                sx={{
                  maxHeight: ['MODERATE', 'POOR'].includes(answers[q.id]?.rating) ? '300px' : '0px',
                  opacity: ['MODERATE', 'POOR'].includes(answers[q.id]?.rating) ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  mt: ['MODERATE', 'POOR'].includes(answers[q.id]?.rating) ? 2.5 : 0
                }}
              >
                <BOSTextField
                  fullWidth
                  size="small"
                  label="Specific comments (MANDATORY)"
                  placeholder="Share details about your experience or reasons for this rating..."
                  value={answers[q.id]?.comments || ''}
                  onChange={(e) => handleCommentChange(q.id, e.target.value)}
                  required
                  error={['MODERATE', 'POOR'].includes(answers[q.id]?.rating) && !answers[q.id]?.comments?.trim()}
                  helperText={['MODERATE', 'POOR'].includes(answers[q.id]?.rating) && !answers[q.id]?.comments?.trim() ? 'Comment is required for MODERATE or POOR rating.' : ''}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#0F172A',
                      '& fieldset': { borderColor: '#1976d2' },
                      '&:hover fieldset': { borderColor: '#115293' },
                      '&.Mui-focused fieldset': { borderColor: '#1976d2', boxShadow: '0 0 8px rgba(25, 118, 210, 0.2)' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.6)' },
                    '& .MuiFormHelperText-root': { color: '#ef4444' }
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>

        {/* Improvements suggestions & comments */}
        <Box
            sx={{
              background: 'background.paper',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '16px',
              p: 3.5,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
              mt: 1.5
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 650, color: '#0F172A', mb: 1.5, fontSize: '1.15rem' }}>
              Suggestions for Improvements
            </Typography>
            <BOSTextField
              fullWidth
              multiline
              rows={3}
              placeholder="What specific improvements would you suggest to enhance employee satisfaction? (optional)"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: '#0F172A',
                  '& fieldset': { borderColor: '#1976d2' },
                  '&:hover fieldset': { borderColor: '#115293' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.6)' }
              }}
            />

            <Typography variant="h3" sx={{ fontWeight: 650, color: '#0F172A', mb: 1.5, fontSize: '1.15rem' }}>
              General Comments
            </Typography>
            <BOSTextField
              fullWidth
              multiline
              rows={3}
              placeholder="Any other feedback or remarks you would like to share with the HR team (optional)..."
              value={generalComments}
              onChange={(e) => setGeneralComments(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#0F172A',
                  '& fieldset': { borderColor: '#1976d2' },
                  '&:hover fieldset': { borderColor: '#115293' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.6)' }
              }}
            />
          </Box>

          {/* footer actions */}
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 2 }}>
            <Button
              onClick={() => navigate('/')}
              startIcon={<IconArrowLeft size={18} />}
              sx={btnCancel}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              disabled={submitLoading}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                borderColor: 'rgba(0, 0, 0, 0.12)',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.825rem',
                py: 0.75,
                px: 2.5,
                '&:hover': {
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  bgcolor: 'rgba(239, 68, 68, 0.05)'
                }
              }}
            >
              Clear Form
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitLoading}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                bgcolor: '#1976d2',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.825rem',
                py: 0.75,
                px: 3.5,
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  bgcolor: '#115293',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                }
              }}
            >
              {submitLoading ? <CircularProgress size={16} color="inherit" /> : 'Submit Feedback'}
            </Button>
          </Stack>
        </Box>
      </Box>
    );
}
