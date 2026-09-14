import { useState } from 'react';
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
import { IconDeviceFloppy, IconX, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSTextField, btnCancel } from 'ui-component/bos';
import axios from 'utils/axios';

// ─── Scoring Map ───────────────────────────────────────────────────────────────
export const RATINGS = [
  { label: 'EXCELLENT', score: 100, color: '#22C55E', emoji: '⭐' },
  { label: 'VERY GOOD', score: 75, color: '#10B981', emoji: '😊' },
  { label: 'GOOD', score: 50, color: '#3B82F6', emoji: '🙂' },
  { label: 'MODERATE', score: 25, color: '#F59E0B', emoji: '😐' },
  { label: 'POOR', score: 0, color: '#EF4444', emoji: '☹' }
];

const MANDATORY_COMMENT_RATINGS = ['MODERATE', 'POOR'];

// ─── Props ─────────────────────────────────────────────────────────────────────
// pendingMapping  : { mappingId, feedbackCycle, isClosed }
// questions       : [{ id, satisfactionCriteria }]
// submitApiUrl    : string  e.g. '/api/hra/employee-satisfaction/submit'
// onSubmitSuccess : () => void  — callback after successful submit
// entityLabel     : string  e.g. 'Employee' | 'Vendor' | 'Customer' | 'Internal Customer'

export default function FeedbackSurveyForm({ pendingMapping, questions, submitApiUrl, onSubmitSuccess, entityLabel = 'Satisfaction' }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [answers, setAnswers] = useState(() => {
    const init = {};
    (questions || []).forEach((q) => { init[q.id] = { rating: '', score: 0, comments: '' }; });
    return init;
  });
  const [suggestions, setSuggestions] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleRatingChange = (qId, ratingValue) => {
    const selected = RATINGS.find((r) => r.label === ratingValue);
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], rating: ratingValue, score: selected ? selected.score : 0 }
    }));
  };

  const handleCommentChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], comments: value } }));
  };

  const handleClear = () => {
    const cleared = {};
    (questions || []).forEach((q) => { cleared[q.id] = { rating: '', score: 0, comments: '' }; });
    setAnswers(cleared);
    setSuggestions('');
    setGeneralComments('');
  };

  const handleSubmit = async () => {
    if (submitLoading) return;

    // Validate all questions rated
    const unrated = (questions || []).filter((q) => !answers[q.id]?.rating);
    if (unrated.length > 0) {
      dispatch(openSnackbar({ open: true, message: `Please rate all ${questions.length} questions before submitting.`, variant: 'alert', severity: 'warning' }));
      return;
    }

    // Validate mandatory comments for Moderate/Poor
    const missingComments = (questions || []).filter((q) => {
      const ans = answers[q.id];
      return MANDATORY_COMMENT_RATINGS.includes(ans?.rating) && !ans?.comments?.trim();
    });
    if (missingComments.length > 0) {
      dispatch(openSnackbar({ open: true, message: 'Moderate and Poor comments are mandatory. Please add comments for all highlighted responses.', variant: 'alert', severity: 'error' }));
      return;
    }

    setSubmitLoading(true);
    try {
      const responsePayload = (questions || []).map((q) => ({
        questionId: q.id,
        rating: answers[q.id].rating,
        score: answers[q.id].score,
        comments: answers[q.id].comments
      }));

      await axios.post(submitApiUrl, {
        mappingId: pendingMapping.mappingId || pendingMapping.id,
        generalComments,
        suggestions,
        responses: responsePayload
      });

      dispatch(openSnackbar({ open: true, message: `${entityLabel} feedback submitted successfully! Thank you.`, variant: 'alert', severity: 'success' }));
      onSubmitSuccess?.();
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: e.response?.data?.message || `Failed to submit ${entityLabel} feedback.`, variant: 'alert', severity: 'error' }));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">No active satisfaction questions found.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={4} sx={{ width: '100%', p: 0 }}>

      {/* Mandatory comment notice */}
      <Box sx={{ bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light', p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconAlertCircle size={22} style={{ color: '#f44336', flexShrink: 0 }} />
        <Typography variant="body2" sx={{ color: 'error.dark', fontWeight: 700 }}>
          Note: Moderate and Poor Comments are Mandatory. Please Enter the Comments.
        </Typography>
      </Box>

      {/* Question list */}
      <Stack spacing={2}>
        {questions.map((q, idx) => {
          const ans = answers[q.id] || {};
          const isMandatoryComment = MANDATORY_COMMENT_RATINGS.includes(ans.rating);
          const commentMissing = isMandatoryComment && !ans.comments?.trim();
          const selectedRating = RATINGS.find((r) => r.label === ans.rating);

          return (
            <Card key={q.id} variant="outlined" sx={{
              borderRadius: 2,
              borderColor: commentMissing ? 'error.light' : 'divider',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s'
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {/* Question row */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'flex-start' }}>

                  {/* LEFT — Question text */}
                  <Box sx={{ minWidth: 260, flex: '0 0 260px' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: 0.5, mb: 0.5 }}>
                      Q{idx + 1}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.dark', lineHeight: 1.4 }}>
                      <span dangerouslySetInnerHTML={{ __html: q?.satisfactionCriteria || '' }} />
                    </Typography>
                  </Box>

                  {/* CENTER — Rating options */}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
                    {RATINGS.map((r) => {
                      const isSelected = ans.rating === r.label;
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

                  {/* RIGHT — Comment box */}
                  <Box sx={{ minWidth: 240, flex: '0 0 240px' }}>
                    <BOSTextField
                      fullWidth
                      size="small"
                      label={isMandatoryComment ? 'Comment (MANDATORY)' : 'Comment (optional)'}
                      placeholder={isMandatoryComment ? 'Required for Moderate / Poor rating...' : 'Optional notes...'}
                      value={ans.comments || ''}
                      onChange={(e) => handleCommentChange(q.id, e.target.value)}
                      multiline
                      rows={2}
                      required={isMandatoryComment}
                      error={commentMissing}
                      helperText={commentMissing ? 'Comment required for Moderate / Poor rating.' : ''}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { borderColor: '#1976d2' },
                          '&:hover fieldset': { borderColor: '#115293' },
                          '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                        }
                      }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Divider />

      {/* Additional Sections */}
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Suggestions for Improvements</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>What specific improvements would you suggest?</Typography>
          <BOSTextField
            fullWidth
            multiline
            rows={3}
            placeholder="Your suggestions..."
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#1976d2' },
                '&:hover fieldset': { borderColor: '#115293' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' }
              }
            }}
          />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>General Comments</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Any other feedback or remarks.</Typography>
          <BOSTextField
            fullWidth
            multiline
            rows={3}
            placeholder="Your general comments..."
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#1976d2' },
                '&:hover fieldset': { borderColor: '#115293' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' }
              }
            }}
          />
        </Box>
      </Stack>

      {/* Action Buttons */}
      <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
        <Stack direction="row" spacing={2}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<IconArrowLeft size={18} />}
            sx={btnCancel}
          >
            Back
          </Button>
          <Button variant="outlined" color="error" startIcon={<IconX size={18} />} onClick={handleClear} disabled={submitLoading}>
            Clear Form
          </Button>
        </Stack>
        <Button
          variant="contained"
          startIcon={submitLoading ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
          onClick={handleSubmit}
          disabled={submitLoading}
          sx={{ px: 5, fontWeight: 700, bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
        >
          {submitLoading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </Stack>
    </Stack>
  );
}
