import { useState, useEffect } from 'react';
import {
  Typography,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Button,
  Box,
  Divider,
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { IconArrowLeft, IconDeviceFloppy, IconSend, IconMoodSmile } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { useNavigate } from 'react-router-dom';
import { btnCancel } from 'ui-component/bos';
import useAuth from 'hooks/useAuth';

const CURRENT_CYCLE = 'June 2026';
const RATINGS = [
  { value: 'Excellent', label: 'Excellent (100)' },
  { value: 'Very Good', label: 'Very Good (75)' },
  { value: 'Good', label: 'Good (50)' },
  { value: 'Moderate', label: 'Moderate (25)' },
  { value: 'Poor', label: 'Poor (0)' }
];

export default function SatisfactionFeedbackEntry() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // State to hold user ratings and comments: { [questionId]: { rating: '', comments: '' } }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAssignmentAndLoad = async () => {
      setLoading(true);
      try {
        // 1. Check pending assignment
        const checkRes = await axios.get('/api/qms/satisfaction/feedback/pending', {
          params: { cycle: CURRENT_CYCLE }
        });

        if (checkRes.status === 204 || !checkRes.data) {
          setHasAssignment(false);
          setLoading(false);
          return;
        }

        setHasAssignment(true);
        setTrackingInfo(checkRes.data);

        // 2. Fetch questions of type 'Employee'
        const qRes = await axios.get('/api/qms/satisfaction/feedback/questions', {
          params: { type: 'Employee' }
        });
        setQuestions(qRes.data || []);

        // 3. Fetch saved draft responses if any
        const savedRes = await axios.get('/api/qms/satisfaction/feedback/saved', {
          params: { cycle: CURRENT_CYCLE, type: 'Employee' }
        });

        const initialAnswers = {};
        qRes.data.forEach((q) => {
          initialAnswers[q.id] = { rating: '', comments: '' };
        });

        if (savedRes.data && savedRes.data.length > 0) {
          savedRes.data.forEach((r) => {
            if (initialAnswers[r.question.id]) {
              initialAnswers[r.question.id] = {
                rating: r.rating,
                comments: r.comments || ''
              };
            }
          });
        }
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Failed to load feedback form details:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAssignmentAndLoad();
  }, [user]);

  const handleRatingChange = (qId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        rating: value
      }
    }));
  };

  const handleCommentChange = (qId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        comments: value
      }
    }));
  };

  const preparePayload = () => {
    return Object.keys(answers).map((qId) => ({
      questionId: Number(qId),
      rating: answers[qId].rating,
      comments: answers[qId].comments
    })).filter((a) => a.rating !== '');
  };

  const handleSaveDraft = async () => {
    const payload = preparePayload();
    if (payload.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please answer at least one question to save a draft.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/qms/satisfaction/feedback/save-draft', payload, {
        params: { cycle: CURRENT_CYCLE }
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Draft saved successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save draft.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    const unanswered = questions.filter((q) => !answers[q.id]?.rating);
    if (unanswered.length > 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please answer all questions before submitting.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    // Validate comments for Moderate and Poor
    for (const q of questions) {
      const ans = answers[q.id];
      if (('Moderate' === ans.rating || 'Poor' === ans.rating) && !ans.comments.trim()) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Comments are mandatory when selecting Moderate or Poor. Please fill out details for Question: "${q.satisfactionCriteria}".`,
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }
    }

    const payload = preparePayload();
    try {
      setSubmitting(true);
      await axios.post('/api/qms/satisfaction/feedback/submit', payload, {
        params: { cycle: CURRENT_CYCLE, type: 'Employee' }
      });
      dispatch(
        openSnackbar({
          open: true,
          message: 'Feedback submitted successfully! Thank you.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setTrackingInfo((prev) => ({ ...prev, status: 'Completed' }));
    } catch (err) {
      console.error(err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to submit feedback.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading Employee Satisfaction feedback form...</Typography>
      </Box>
    );
  }

  if (!hasAssignment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" variant="filled" sx={{ borderRadius: '8px' }}>
          <AlertTitle>No Assignment Found</AlertTitle>
          You do not have a pending Employee Satisfaction assignment for cycle <b>{CURRENT_CYCLE}</b>.
        </Alert>
      </Box>
    );
  }

  if (trackingInfo?.status === 'Completed') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: '8px' }}>
          <AlertTitle>Feedback Submitted</AlertTitle>
          Thank you! Your feedback for cycle <b>{CURRENT_CYCLE}</b> has already been submitted.
        </Alert>
      </Box>
    );
  }

  return (
    <MainCard
      icon={IconMoodSmile}
      title={<Typography variant="h3">Employee Satisfaction Feedback - {CURRENT_CYCLE}</Typography>}
      secondary={
        <Button
          onClick={() => navigate(-1)}
          startIcon={<IconArrowLeft size={18} />}
          sx={btnCancel}
        >
          Back
        </Button>
      }
    >
      {/* Top Warning Message */}
      <Box
        sx={{
          bgcolor: '#FFEBEE',
          border: '1px solid #FFCDD2',
          borderRadius: '6px',
          p: 2,
          mb: 4
        }}
      >
        <Typography variant="subtitle1" sx={{ color: '#C62828', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          Note: Moderate and Poor comments are mandatory. Please enter comments when selecting Moderate or Poor.
        </Typography>
      </Box>

      {/* Questions List */}
      <Stack spacing={3} divider={<Divider />}>
        {questions.map((q, idx) => {
          const ratingVal = answers[q.id]?.rating || '';
          const commentVal = answers[q.id]?.comments || '';
          const isCommentRequired = ratingVal === 'Moderate' || ratingVal === 'Poor';

          return (
            <Paper key={q.id} variant="outlined" sx={{ p: 3, border: 'none', bgcolor: 'transparent' }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ marginRight: '8px' }}>{idx + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: q?.satisfactionCriteria || '' }} />
              </Typography>

              {/* Radio Group for Rating Options */}
              <FormControl component="fieldset" fullWidth sx={{ mb: 2.5 }}>
                <RadioGroup
                  row
                  value={ratingVal}
                  onChange={(e) => handleRatingChange(q.id, e.target.value)}
                  sx={{ gap: 4 }}
                >
                  {RATINGS.map((r) => (
                    <FormControlLabel
                      key={r.value}
                      value={r.value}
                      control={<Radio color="primary" />}
                      label={
                        <Typography variant="body1" sx={{ fontWeight: ratingVal === r.value ? 600 : 400 }}>
                          {r.value}
                        </Typography>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Comment Textbox */}
              <TextField
                fullWidth
                size="small"
                label={`Comments${isCommentRequired ? ' (Mandatory)' : ' (Optional)'}`}
                value={commentVal}
                onChange={(e) => handleCommentChange(q.id, e.target.value)}
                placeholder="Enter details or comments here..."
                error={isCommentRequired && !commentVal.trim()}
                helperText={isCommentRequired && !commentVal.trim() ? 'Comment is mandatory for Moderate or Poor ratings' : ''}
              />
            </Paper>
          );
        })}
      </Stack>

      <Divider sx={{ my: 4 }} />

      {/* Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          color="primary"
          startIcon={<IconDeviceFloppy size={18} />}
          onClick={handleSaveDraft}
          disabled={submitting}
        >
          Save Draft
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<IconSend size={18} />}
          onClick={handleSubmit}
          disabled={submitting}
        >
          Submit Feedback
        </Button>
      </Stack>
    </MainCard>
  );
}
