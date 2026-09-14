import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Stack,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Grid,
  CircularProgress,
  IconButton
} from '@mui/material';
import { IconAlertTriangle, IconRefresh, IconCheck, IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSTextField } from 'ui-component/bos';

const RATINGS = [
  { label: 'EXCELLENT', score: 100, color: '#2e7d32' },
  { label: 'VERY GOOD', score: 75, color: '#4caf50' },
  { label: 'GOOD', score: 50, color: '#2196f3' },
  { label: 'MODERATE', score: 25, color: '#ff9800' },
  { label: 'POOR', score: 0, color: '#f44336' }
];

export default function CustomerSatisfactionPopup({ open, onClose, mappingId }) {
  const dispatch = useDispatch();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [generalComments, setGeneralComments] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (open && mappingId) {
      loadQuestions();
    }
  }, [open, mappingId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customer-satisfaction/customer-feedback/questions');
      const data = res.data || [];
      setQuestions(data);

      const initialAnswers = {};
      data.forEach((q) => {
        initialAnswers[q.id] = {
          questionId: q.id,
          rating: '',
          comments: ''
        };
      });
      setAnswers(initialAnswers);
      setValidationErrors({});
    } catch (e) {
      console.error(e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load customer feedback criteria.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (qId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        rating: val
      }
    }));

    if (['EXCELLENT', 'VERY GOOD', 'GOOD'].includes(val)) {
      setValidationErrors((errs) => {
        const next = { ...errs };
        delete next[qId];
        return next;
      });
    }
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

  const handleRefresh = () => {
    const cleared = {};
    questions.forEach((q) => {
      cleared[q.id] = {
        questionId: q.id,
        rating: '',
        comments: ''
      };
    });
    setAnswers(cleared);
    setGeneralComments('');
    setValidationErrors({});
  };

  const handleLater = async () => {
    try {
      await axios.post(`/api/customer-satisfaction/customer-feedback/later?mappingId=${mappingId}`);
      sessionStorage.setItem(`customerSatisfactionDismissed_${mappingId}`, 'true');
      onClose();
    } catch (e) {
      console.error(e);
      onClose();
    }
  };

  const handleSubmit = async () => {
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
      dispatch(
        openSnackbar({
          open: true,
          message: `Please rate all items. Unanswered: ${unanswered.join(', ')}`,
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    if (missingComments.length > 0) {
      setValidationErrors(newErrors);
      dispatch(
        openSnackbar({
          open: true,
          message: `Comment is required for Moderate/Poor ratings on line(s): ${missingComments.join(', ')}`,
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    setSubmitLoading(true);
    try {
      const responsesPayload = Object.values(answers);
      const payload = {
        mappingId,
        generalComments,
        responses: responsesPayload
      };

      await axios.post('/api/customer-satisfaction/customer-feedback/submit', payload);

      dispatch(
        openSnackbar({
          open: true,
          message: 'Feedback submitted successfully! Thank you.',
          variant: 'alert',
          severity: 'success'
        })
      );
      onClose();
    } catch (e) {
      console.error(e);
      dispatch(
        openSnackbar({
          open: true,
          message: e.response?.data?.message || 'Failed to submit feedback.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '16px', bgcolor: 'background.paper' } }}>
      <DialogTitle sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 800 }}>
          Customer Satisfaction Feedback Form
        </Typography>
        <IconButton onClick={handleLater} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Top Warning Note */}
          <Box
            sx={{
              bgcolor: 'error.lighter',
              border: '1px solid',
              borderColor: 'error.light',
              p: 2,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <IconAlertTriangle size={22} color="#f44336" />
            <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 700 }}>
              Note: Moderate and Poor Comments are Mandatory.. Please Enter the Comments...
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {questions.map((q, idx) => {
                const currentRating = answers[q.id]?.rating || '';
                const isCommentMandatory = ['MODERATE', 'POOR'].includes(currentRating);
                const hasError = !!validationErrors[q.id];

                return (
                  <Box
                    key={q.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: hasError ? 'error.main' : 'divider',
                      borderRadius: '12px',
                      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={7}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'blue', mb: 1.5 }}>
                          {idx + 1}. {q.satisfactionCriteria}
                        </Typography>

                        <RadioGroup
                          row
                          value={currentRating}
                          onChange={(e) => handleRatingChange(q.id, e.target.value)}
                          sx={{ gap: 1 }}
                        >
                          {RATINGS.map((r) => {
                            const isChecked = currentRating === r.label;
                            return (
                              <FormControlLabel
                                key={r.label}
                                value={r.label}
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      color: r.color,
                                      '&.Mui-checked': { color: r.color }
                                    }}
                                  />
                                }
                                label={
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: isChecked ? 700 : 500,
                                      color: isChecked ? r.color : 'text.secondary',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {r.label}
                                  </Typography>
                                }
                                sx={{
                                  border: '1px solid',
                                  borderColor: isChecked ? r.color : 'divider',
                                  borderRadius: '6px',
                                  px: 1,
                                  py: 0.2,
                                  mr: 0,
                                  minWidth: '100px',
                                  bgcolor: isChecked ? `${r.color}0a` : 'transparent',
                                  transition: 'all 0.15s ease-in-out'
                                }}
                              />
                            );
                          })}
                        </RadioGroup>
                      </Grid>

                      <Grid item xs={12} md={5}>
                        {isCommentMandatory && (
                          <BOSTextField
                            fullWidth
                            size="small"
                            label="Mandatory Comment"
                            placeholder="Provide reason for Poor/Moderate rating..."
                            value={answers[q.id]?.comments || ''}
                            onChange={(e) => handleCommentChange(q.id, e.target.value)}
                            error={hasError}
                            helperText={validationErrors[q.id]}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  General Remarks / Comments
                </Typography>
                <BOSTextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Any other comments..."
                  value={generalComments}
                  onChange={(e) => setGeneralComments(e.target.value)}
                />
              </Box>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: 'background.paper', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<IconRefresh size={16} />}
          onClick={handleRefresh}
          sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { borderColor: '#115293', bgcolor: 'rgba(25, 118, 210, 0.04)' } }}
        >
          Refresh
        </Button>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={handleLater}
            sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { borderColor: '#115293', bgcolor: 'rgba(25, 118, 210, 0.04)' } }}
          >
            Later
          </Button>
          <Button
            variant="contained"
            disabled={submitLoading || loading}
            onClick={handleSubmit}
            sx={{ bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#115293' } }}
          >
            {submitLoading ? <CircularProgress size={16} color="inherit" /> : 'Submit'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
