import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Typography,
  Button,
  Stack,
  Box,
  Card,
  Grid,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import {
  IconArrowLeft,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconClipboardCheck
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSTextField, BOSPageHeader, BOSPillTabs, btnSave, btnCancel, btnClear } from 'ui-component/bos';

const RATINGS = [
  { label: 'EXCELLENT', score: 100, color: '#22C55E', emoji: '⭐' },
  { label: 'VERY GOOD', score: 75, color: '#10B981', emoji: '😊' },
  { label: 'GOOD', score: 50, color: '#3B82F6', emoji: '🙂' },
  { label: 'MODERATE', score: 25, color: '#F59E0B', emoji: '😐' },
  { label: 'POOR', score: 0, color: '#EF4444', emoji: '☹' }
];

const DEFAULT_QUESTIONS = {
  Employee: [
    "Overall experience working at company",
    "Work environment & facilities",
    "Team collaboration",
    "Manager support",
    "Leadership communication",
    "Job satisfaction",
    "Career growth opportunities",
    "Recognition & appreciation",
    "Feedback process effectiveness",
    "Compensation & benefits satisfaction"
  ],
  Vendor: [
    "Clarity of purchase orders and requirements",
    "Timeliness of payment process",
    "Communication with procurement team",
    "Delivery schedule alignment",
    "Vendor evaluation fairness",
    "Technical specification accuracy",
    "Logistics & receiving process satisfaction",
    "Dispute resolution efficiency",
    "Long-term partnership satisfaction"
  ],
  Customer: [
    "Quality of products/services",
    "Timeliness of delivery",
    "Support responsiveness",
    "Pricing transparency",
    "Business understanding",
    "Professionalism",
    "Ease of system usage",
    "Recommendation likelihood",
    "Problem resolution effectiveness"
  ],
  'Internal Customer': [
    "Inter-department support",
    "Service speed",
    "Work accuracy",
    "Communication clarity",
    "Goal alignment",
    "Issue resolution efficiency",
    "Professional behavior",
    "Data accessibility",
    "Adaptability to change"
  ]
};

const getQuestionsKey = (type) => {
  if (type === 'InternalCustomer') return 'Internal Customer';
  return type;
};

export default function SatisfactionFeedbackEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // URL parameters parsing
  const queryParams = new URLSearchParams(location.search);
  const urlMappingId = queryParams.get('mappingId');
  const urlType = queryParams.get('type'); 

  const currentPath = window.location.pathname;
  const pathType = currentPath.includes('/hr/') ? 'Employee' : 'Vendor';

  const [satisfactionType, setSatisfactionType] = useState(urlType || pathType);
  const [mappingId, setMappingId] = useState(urlMappingId || '');
  const [pendingMappings, setPendingMappings] = useState([]);
  
  const formatCycle = (cycle) => {
    if (!cycle) return '';
    const match = cycle.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = match[1];
      const monthIndex = parseInt(match[2], 10) - 1;
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${months[monthIndex]} ${year}`;
      }
    }
    return cycle;
  };
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [generalComments, setGeneralComments] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // 1. Fetch pending mappings for dropdown selection if no urlMappingId is supplied
  useEffect(() => {
    const fetchPending = async () => {
      try {
        if (!urlMappingId) {
          if (satisfactionType === 'Employee') {
            const res = await axios.get('/api/hra/employee-satisfaction/my-pending');
            setPendingMappings(res.data || []);
            if (res.data && res.data.length > 0) {
              setMappingId(res.data[0].mappingId);
            } else {
              setMappingId('');
            }
          } else if (satisfactionType === 'Customer') {
            const res = await axios.get('/api/customer-satisfaction/customer-feedback/mappings');
            const pendingList = (res.data || []).filter(m => m.status === 'Pending' || m.status === 'Overdue');
            setPendingMappings(pendingList.map(m => ({
              mappingId: m.id,
              feedbackCycle: m.feedbackCycle,
              vendorName: m.customerName
            })));
            if (pendingList.length > 0) {
              setMappingId(pendingList[0].id);
            } else {
              setMappingId('');
            }
          } else if (satisfactionType === 'InternalCustomer' || satisfactionType === 'Internal Customer') {
            const res = await axios.get('/api/qms/internal-customer-satisfaction/mappings');
            const pendingList = (res.data || []).filter(m => m.status === 'Pending' || m.status === 'Overdue');
            setPendingMappings(pendingList.map(m => ({
              mappingId: m.id,
              feedbackCycle: m.feedbackCycle,
              vendorName: m.employeeName
            })));
            if (pendingList.length > 0) {
              setMappingId(pendingList[0].id);
            } else {
              setMappingId('');
            }
          } else {
            const res = await axios.get('/api/qms/vendor-satisfaction/mappings');
            const pendingList = (res.data || []).filter(m => m.status === 'Pending' || m.status === 'Overdue');
            setPendingMappings(pendingList.map(m => ({
              mappingId: m.id,
              feedbackCycle: m.feedbackCycle,
              vendorName: m.vendorName
            })));
            if (pendingList.length > 0) {
              setMappingId(pendingList[0].id);
            } else {
              setMappingId('');
            }
          }
        }
      } catch (e) {
        console.error('Error fetching pending mappings', e);
      }
    };
    fetchPending();
  }, [satisfactionType, urlMappingId]);

  // 2. Fetch questions whenever type changes
  useEffect(() => {
    const loadSurveyQuestions = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/qms/satisfaction-criteria');
        const dbCriteria = res.data || [];
        const targetKey = getQuestionsKey(satisfactionType);
        const filtered = dbCriteria.filter(
          (c) =>
            c.status === true &&
            c.satisfactionType &&
            c.satisfactionType.split(', ').some(t => t.trim() === satisfactionType || t.trim() === targetKey)
        );

        let finalQuestions = [];
        if (filtered.length > 0) {
          finalQuestions = filtered.map((c) => ({
            id: c.id,
            criteria: c.satisfactionCriteria
          }));
        } else {
          const defaults = DEFAULT_QUESTIONS[targetKey] || [];
          finalQuestions = defaults.map((q, idx) => ({
            id: idx + 999,
            criteria: q
          }));
        }

        setQuestions(finalQuestions);

        // Reset answers
        const initialAnswers = {};
        finalQuestions.forEach((q) => {
          initialAnswers[q.id] = {
            questionId: q.id,
            questionText: q.criteria,
            rating: '',
            score: 0,
            comments: ''
          };
        });
        setAnswers(initialAnswers);
        setValidationErrors({});
      } catch (err) {
        console.error('Failed to load questions:', err);
        const defaults = DEFAULT_QUESTIONS[getQuestionsKey(satisfactionType)] || [];
        const finalQuestions = defaults.map((q, idx) => ({
          id: idx + 999,
          criteria: q
        }));
        setQuestions(finalQuestions);
        const initialAnswers = {};
        finalQuestions.forEach((q) => {
          initialAnswers[q.id] = {
            questionId: q.id,
            questionText: q.criteria,
            rating: '',
            score: 0,
            comments: ''
          };
        });
        setAnswers(initialAnswers);
        setValidationErrors({});
      } finally {
        setLoading(false);
      }
    };

    loadSurveyQuestions();
  }, [satisfactionType]);

  const handleRatingChange = (qId, ratingValue) => {
    const selected = RATINGS.find((r) => r.label === ratingValue);
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [qId]: {
          ...prev[qId],
          rating: ratingValue,
          score: selected ? selected.score : 0
        }
      };

      if (['EXCELLENT', 'VERY GOOD', 'GOOD'].includes(ratingValue)) {
        setValidationErrors((errs) => {
          const next = { ...errs };
          delete next[qId];
          return next;
        });
      }

      return updated;
    });
  };

  const handleCommentChange = (qId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        comments: val
      }
    }));

    if (val.trim()) {
      setValidationErrors((errs) => {
        const next = { ...errs };
        delete next[qId];
        return next;
      });
    }
  };

  const handleClear = () => {
    const cleared = {};
    questions.forEach((q) => {
      cleared[q.id] = {
        questionId: q.id,
        questionText: q.criteria,
        rating: '',
        score: 0,
        comments: ''
      };
    });
    setAnswers(cleared);
    setGeneralComments('');
    setValidationErrors({});
    dispatch(
      openSnackbar({
        open: true,
        message: 'Feedback entry has been reset.',
        variant: 'alert',
        severity: 'info'
      })
    );
  };

  const handleSubmit = async () => {
    if (!mappingId) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'No pending survey cycle mapping is selected.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    // Validate responses
    const unanswered = [];
    const missingComments = [];
    const newErrors = {};

    questions.forEach((q, idx) => {
      const ans = answers[q.id];
      if (!ans || !ans.rating) {
        unanswered.push(idx + 1);
      } else if (['MODERATE', 'POOR'].includes(ans.rating)) {
        if (!ans.comments || !ans.comments.trim()) {
          missingComments.push(idx + 1);
          newErrors[q.id] = 'Comment is mandatory for MODERATE or POOR rating.';
        }
      }
    });

    if (unanswered.length > 0) {
      // Find the first unanswered question card and scroll to it
      const firstUnansweredIndex = questions.findIndex(q => !answers[q.id]?.rating);
      if (firstUnansweredIndex !== -1) {
        const qId = questions[firstUnansweredIndex].id;
        const element = document.getElementById(`question-card-${qId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      dispatch(
        openSnackbar({
          open: true,
          message: `Please rate all questions. Unanswered: ${unanswered.join(', ')}`,
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    if (missingComments.length > 0) {
      // Find the first question missing a mandatory comment and scroll to it
      const firstMissingCommentIndex = questions.findIndex(q => {
        const ans = answers[q.id];
        return ans && ['MODERATE', 'POOR'].includes(ans.rating) && (!ans.comments || !ans.comments.trim());
      });
      if (firstMissingCommentIndex !== -1) {
        const qId = questions[firstMissingCommentIndex].id;
        const element = document.getElementById(`question-card-${qId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      setValidationErrors(newErrors);
      dispatch(
        openSnackbar({
          open: true,
          message: `Comment is required for Moderate/Poor ratings on question(s): ${missingComments.join(', ')}`,
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const responsePayload = Object.values(answers);

      const payload = {
        mappingId,
        generalComments,
        responses: responsePayload
      };

      if (satisfactionType === 'Employee') {
        await axios.post('/api/hra/employee-satisfaction/submit', payload);
      } else if (satisfactionType === 'Customer') {
        await axios.post('/api/customer-satisfaction/customer-feedback/submit', payload);
      } else if (satisfactionType === 'InternalCustomer' || satisfactionType === 'Internal Customer') {
        await axios.post('/api/qms/internal-customer-satisfaction/submit', payload);
      } else {
        await axios.post('/api/qms/vendor-satisfaction/submit', payload);
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Survey feedback submitted successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );

      navigate(-1);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: err.response?.data?.message || err.response?.data || 'Failed to submit feedback.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalQuestions = questions.length;
  const answeredCount = questions.filter(q => answers[q.id]?.rating).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <Box
      sx={{
        mx: { xs: -2, sm: -3 },
        width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
        borderRadius: 0,
        pb: 12
      }}
    >
      <BOSPageHeader
        title={`${satisfactionType === 'InternalCustomer' ? 'Internal Customer' : satisfactionType} Satisfaction Survey`}
        subtitle="Submit feedback and evaluation ratings"
        icon={IconClipboardCheck}
        actions={
          <BOSPillTabs
            tabs={[
              { label: 'Employee', value: 'Employee' },
              { label: 'Vendor', value: 'Vendor' },
              { label: 'Customer', value: 'Customer' },
              { label: 'Internal Customer', value: 'InternalCustomer' }
            ]}
            value={satisfactionType}
            onChange={(val) => !urlType && setSatisfactionType(val)}
            orientation="horizontal"
          />
        }
      />

      <Box sx={{ p: 3, width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={12}>
            <CircularProgress size={36} thickness={4} sx={{ color: '#4f46e5' }} />
          </Box>
        ) : (
          <>
            {/* Pending Mapping Selector */}
            {pendingMappings.length > 0 ? (
              <FormControl fullWidth sx={{ mb: 2.5 }}>
                <InputLabel id="select-mapping-label">
                  Select {satisfactionType === 'InternalCustomer' ? 'Internal Customer' : satisfactionType} to Review
                </InputLabel>
                <Select
                  labelId="select-mapping-label"
                  id="select-mapping"
                  value={mappingId}
                  label={`Select ${satisfactionType === 'InternalCustomer' ? 'Internal Customer' : satisfactionType} to Review`}
                  onChange={(e) => setMappingId(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#0F172A',
                      '& fieldset': { borderColor: '#1976d2' },
                      '&:hover fieldset': { borderColor: '#115293' },
                      '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                    }
                  }}
                >
                  {pendingMappings.map((m) => (
                    <MenuItem key={m.mappingId} value={m.mappingId}>
                      {m.vendorName} ({formatCycle(m.feedbackCycle)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: '#FFFBEB',
                  border: '1px solid #FEF3C7',
                  borderRadius: '12px',
                  p: 3,
                  mb: 3
                }}
              >
                <IconAlertCircle size={28} style={{ color: '#D97706' }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 650, color: '#92400E', mb: 0.5 }}>
                    No Pending Survey Mappings
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#B45309' }}>
                    There are no pending {satisfactionType === 'InternalCustomer' ? 'internal customer' : satisfactionType.toLowerCase()} survey cycles assigned. Please create or schedule mappings before entering feedback.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Weightless Progress Tracker */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                {answeredCount} / {totalQuestions} Completed
              </Typography>
              <Typography sx={{ fontWeight: 750, color: '#4f46e5', fontSize: '0.875rem' }}>
                {progressPercent}% Done
              </Typography>
            </Box>
            <Box sx={{ width: '100%', height: '3px', bgcolor: 'rgba(0, 0, 0, 0.06)', borderRadius: '2.5px', position: 'relative', overflow: 'visible', mb: 2 }}>
              <Box
                sx={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  bgcolor: '#4f46e5',
                  boxShadow: '0 0 10px rgba(79, 70, 229, 0.3)',
                  borderRadius: '2.5px',
                  transition: 'width 0.45s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}
              />
            </Box>

            {/* Questions List */}
            <Stack spacing={3.5}>
              {questions.map((q, idx) => {
                const currentRating = answers[q.id]?.rating || '';
                const isCommentMandatory = ['MODERATE', 'POOR'].includes(currentRating);
                const hasError = !!validationErrors[q.id];

                return (
                  <Box
                    key={q.id}
                    id={`question-card-${q.id}`}
                    sx={{
                      background: 'background.paper',
                      border: '1px solid',
                      borderColor: hasError ? '#ef4444' : 'rgba(0, 0, 0, 0.08)',
                      borderRadius: '16px',
                      p: 3.5,
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#0F172A', mb: 2.5, fontSize: '1.05rem', lineHeight: 1.5 }}>
                      {idx + 1}. {q.criteria}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                      {RATINGS.map((r) => {
                        const isChecked = currentRating === r.label;
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
                              borderColor: isChecked ? ratingColor : 'rgba(0, 0, 0, 0.08)',
                              bgcolor: isChecked ? `${ratingColor}10` : '#FFFFFF',
                              color: isChecked ? ratingColor : '#475569',
                              transform: isChecked ? 'scale(1.05)' : 'scale(1)',
                              boxShadow: isChecked ? `0 0 12px ${glowColor}` : 'none',
                              transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
                              WebkitUserSelect: 'none', userSelect: 'none',
                              minWidth: '105px',
                              '&:hover': {
                                transform: isChecked ? 'scale(1.05)' : 'scale(1.02)',
                                bgcolor: isChecked ? `${ratingColor}15` : 'rgba(0, 0, 0, 0.02)',
                                borderColor: isChecked ? ratingColor : 'rgba(0, 0, 0, 0.2)'
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

                    {/* Smooth comments slider */}
                    <Box
                      sx={{
                        maxHeight: isCommentMandatory ? '300px' : '0px',
                        opacity: isCommentMandatory ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        mt: isCommentMandatory ? 2.5 : 0
                      }}
                    >
                      <BOSTextField
                        fullWidth
                        size="small"
                        label="Specific comments (MANDATORY)"
                        placeholder="Please specify why you chose this rating..."
                        value={answers[q.id]?.comments || ''}
                        onChange={(e) => handleCommentChange(q.id, e.target.value)}
                        required={isCommentMandatory}
                        error={hasError}
                        helperText={validationErrors[q.id]}
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
                );
              })}
            </Stack>

            {/* General Comments card */}
            <Box
              sx={{
                background: 'background.paper',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '16px',
                p: 3.5,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                mt: 1.5,
                mb: 4
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 650, color: '#0F172A', mb: 1.5, fontSize: '1.15rem' }}>
                General Comments
              </Typography>
              <BOSTextField
                fullWidth
                multiline
                rows={3}
                placeholder="Any other feedback or remarks..."
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
          </>
        )}
      </Box>

      {/* Sticky Bottom Navigation Footer */}
      {!loading && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(255, 255, 255, 0.96)',
            WebkitBackdropFilter: 'blur(10px)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.08)',
            py: 2,
            px: { xs: 3, md: 6 },
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            zIndex: 100,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.03)'
          }}
        >
          <Stack direction="row" spacing={2}>
            <Button
              onClick={() => navigate(-1)}
              startIcon={<IconArrowLeft size={18} />}
              sx={btnCancel}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              onClick={handleClear}
              sx={btnClear}
            >
              Clear Form
            </Button>
            <Button
              variant="contained"
              disabled={submitLoading || !mappingId}
              onClick={handleSubmit}
              sx={btnSave}
            >
              {submitLoading ? <CircularProgress size={16} color="inherit" /> : 'Submit Feedback'}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
