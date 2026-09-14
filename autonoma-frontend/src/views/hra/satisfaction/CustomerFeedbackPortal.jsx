import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Stack, Box, CircularProgress, Dialog, DialogContent, DialogTitle, DialogActions } from '@mui/material';
import { IconUsers, IconMoodSmile, IconLock, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import { btnCancel } from 'ui-component/bos';
import FeedbackSurveyForm from './components/FeedbackSurveyForm';

// ─── Customer Feedback Portal ──────────────────────────────────────────────────
// Route: /hra/satisfaction/customer-feedback
// API:
//   GET  /api/customer-satisfaction/customer-feedback/my-pending  → [{ mappingId, feedbackCycle, isClosed, status }]
//   GET  /api/customer-satisfaction/customer-feedback/questions   → [{ id, satisfactionCriteria }]
//   POST /api/customer-satisfaction/customer-feedback/submit

export default function CustomerFeedbackPortal() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [pendingMapping, setPendingMapping] = useState(null);
  const [closedMapping, setClosedMapping] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const loadPortalData = useCallback(async () => {
    setLoading(true);
    try {
      const mapRes = await axios.get('/api/customer-satisfaction/customer-feedback/my-pending');
      const mappings = mapRes.data || [];

      const pending = mappings.find((m) => m.status === 'Pending' || m.status === 'Overdue');
      const closed  = mappings.find((m) => m.isClosed === 'Y' || m.status === 'Closed');

      if (pending) {
        setPendingMapping(pending);
        const qRes = await axios.get('/api/customer-satisfaction/customer-feedback/questions');
        setQuestions(qRes.data || []);
      } else if (closed) {
        setClosedMapping(closed);
      } else {
        setPendingMapping(null);
        setClosedMapping(null);
      }
    } catch (e) {
      console.error('Error loading customer feedback portal', e);
      dispatch(openSnackbar({ open: true, message: 'Error loading feedback data.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { loadPortalData(); }, [loadPortalData]);

  const handleSubmitSuccess = () => {
    setShowForm(false);
    setPendingMapping(null);
    dispatch(openSnackbar({ open: true, message: 'Customer feedback submitted! Thank you.', variant: 'alert', severity: 'success' }));
    loadPortalData();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (closedMapping) {
    return (
      <MainCard title={<Stack direction="row" alignItems="center" spacing={1.5}><IconLock size={24} style={{ color: '#9e9e9e' }} /><Typography variant="h3">Customer Satisfaction Feedback</Typography></Stack>}>
        <Stack alignItems="center" spacing={2} sx={{ p: 4, textAlign: 'center' }}>
          <IconLock size={64} style={{ color: '#9e9e9e' }} />
          <Typography variant="h2" color="text.secondary">Feedback Cycle Closed</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px' }}>
            The feedback window for cycle <strong>{closedMapping.feedbackCycle}</strong> has closed after 7 days. No further submissions are accepted.
          </Typography>
          <Button
            onClick={() => navigate(-1)}
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
      <MainCard title={<Stack direction="row" alignItems="center" spacing={1.5}><IconUsers size={24} style={{ color: '#00796b' }} /><Typography variant="h3">Customer Satisfaction Feedback</Typography></Stack>}>
        <Stack alignItems="center" spacing={2} sx={{ p: 4, textAlign: 'center' }}>
          <IconMoodSmile size={64} style={{ color: '#4caf50' }} />
          <Typography variant="h2">No Feedback Assigned</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '500px' }}>
            There are no active customer satisfaction surveys awaiting your feedback. Surveys are assigned periodically by the HR/Admin team.
          </Typography>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<IconArrowLeft size={18} />}
            sx={{ ...btnCancel, mt: 2 }}
          >
            Back
          </Button>
        </Stack>
      </MainCard>
    );
  }

  if (!showForm) {
    return (
      <>
        <Dialog open maxWidth="xs" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconUsers size={22} color="#00796b" />
              <Typography variant="h4" fontWeight={700}>Pending Feedback Reminder</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 1 }}>
              You have a pending customer satisfaction survey for feedback cycle:
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700}>{pendingMapping.feedbackCycle}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please complete your feedback at the earliest. After 7 days the cycle will be closed automatically.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="contained" color="primary" fullWidth onClick={() => setShowForm(true)} sx={{ fontWeight: 700 }}>
              Start Feedback
            </Button>
          </DialogActions>
        </Dialog>

        <MainCard title={<Stack direction="row" alignItems="center" spacing={1.5}><IconUsers size={24} color="#00796b" /><Typography variant="h3">Customer Satisfaction Survey</Typography></Stack>}
          secondary={<Typography variant="subtitle1" color="primary">Cycle: {pendingMapping.feedbackCycle}</Typography>}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">You have a pending feedback survey. Please complete it.</Typography>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" sx={{ fontWeight: 700, px: 5 }} onClick={() => setShowForm(true)}>
                Start Feedback
              </Button>
              <Button
                onClick={() => navigate(-1)}
                startIcon={<IconArrowLeft size={18} />}
                sx={btnCancel}
              >
                Back
              </Button>
            </Stack>
          </Box>
        </MainCard>
      </>
    );
  }

  return (
    <MainCard
      title={<Stack direction="row" alignItems="center" spacing={1.5}><IconUsers size={24} color="#00796b" /><Typography variant="h3">Customer Satisfaction Survey</Typography></Stack>}
      secondary={<Typography variant="subtitle1" color="primary" fontWeight={700}>Cycle: {pendingMapping.feedbackCycle}</Typography>}
    >
      <FeedbackSurveyForm
        pendingMapping={pendingMapping}
        questions={questions}
        submitApiUrl="/api/customer-satisfaction/customer-feedback/submit"
        onSubmitSuccess={handleSubmitSuccess}
        entityLabel="Customer"
      />
    </MainCard>
  );
}
