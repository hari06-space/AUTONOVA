import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  CircularProgress,
  Container,
  Zoom,
  Fade,
  Tooltip
} from '@mui/material';
import {
  IconCheck,
  IconAlertTriangle,
  IconClipboardCheck,
  IconThumbUp,
  IconThumbDown,
  IconSend
} from '@tabler/icons-react';
import AnimateButton from 'ui-component/extended/AnimateButton';
import Logo from 'ui-component/Logo';

import { CandidatePortalSplash } from 'modules/candidate/CandidatePortalShared';

export default function InductionFeedbackPortal() {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [details, setDetails] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Access token is missing in the URL link.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        const { data } = await axios.get(`/api/public/induction-feedback?token=${token}`, {
           skipGlobalAlert: true
        });
        setAssignment(data.assignment || null);
        // Initialize responses with empty comments if null
        const initializedDetails = (data.details || []).map(d => ({
           ...d,
           traineeStatus: d.traineeStatus || '',
           traineeComments: d.traineeComments || ''
        }));
        setDetails(initializedDetails);
      } catch (err) {
        setErrorMsg(typeof err === 'string' ? err : 'Invalid or expired feedback link.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  const updateDetail = (detailId, field, value) => {
    setDetails(prev =>
      prev.map(d => d.id === detailId ? { ...d, [field]: value } : d)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    for (const d of details) {
      if (!d.traineeStatus) {
        alert('Please select Understood (👍) or Need Training (👎) for all items.');
        return;
      }
      if (!d.traineeComments || !d.traineeComments.trim()) {
        alert('Please write comments/remarks for all items.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await axios.post('/api/public/induction-feedback/submit', {
        token,
        responses: details
      });
      setSuccess(true);
    } catch (err) {
      alert(typeof err === 'string' ? err : 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!assignment?.inductionDate) return '-';
    try {
      const parts = assignment.inductionDate.split('T')[0].split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    } catch (e) {
      return assignment.inductionDate;
    }
  }, [assignment]);

  // Loading view
  if (loading) {
    return (
      <CandidatePortalSplash
        title="Induction Feedback Portal"
        greetingName="Welcome"
        subtext="Initialising feedback portal..."
        themeMode="dark"
      />
    );
  }

  // Error/Expired view
  if (errorMsg) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        p: 2
      }}>
        <Fade in={true} timeout={600}>
          <Card sx={{
            maxWidth: 500,
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            color: 'white'
          }}>
            <CardContent sx={{ p: 4 }}>
              <IconAlertTriangle size={64} color={theme.palette.error.main} style={{ marginBottom: 16 }} />
              <Typography variant="h2" sx={{ mb: 2, fontWeight: 700, letterSpacing: '0.5px' }}>
                Link Expired or Invalid
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, fontSize: '1.1rem' }}>
                {errorMsg}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                Please contact your HR department or trainer if you need a new feedback link generated.
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    );
  }

  // Success view
  if (success) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        p: 2
      }}>
        <Zoom in={true} timeout={500}>
          <Card sx={{
            maxWidth: 500,
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            color: 'white'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(46, 125, 50, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto'
              }}>
                <IconCheck size={48} color={theme.palette.success.light} />
              </Box>
              <Typography variant="h2" sx={{ mb: 2, fontWeight: 700 }}>
                Thank You!
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, fontSize: '1.1rem' }}>
                Your induction training feedback has been successfully submitted to your trainer, {assignment?.trainerName}.
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                This link is now deactivated and can no longer be used. You can safely close this window.
              </Typography>
            </CardContent>
          </Card>
        </Zoom>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      py: 6,
      px: 2
    }}>
      <Container maxWidth="lg">
        {/* Header Logo */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Logo />
          <Typography variant="h4" color="white" sx={{ opacity: 0.8, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconClipboardCheck size={20} /> Induction Feedback Portal
          </Typography>
        </Stack>

        <Fade in={true} timeout={500}>
          <Card sx={{
            borderRadius: '16px',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'white',
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: 4 }}>
              
              {/* Training Info Summary */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                  Trainee Feedback Form ({assignment?.screeningLevel || ''})
                </Typography>
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                  gap: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  p: 3,
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Trainee Name</Typography>
                    <Typography variant="h4" sx={{ color: 'white', mt: 0.5 }}>{assignment?.empName || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Trainer Name</Typography>
                    <Typography variant="h4" sx={{ color: 'white', mt: 0.5 }}>{assignment?.trainerName || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Department</Typography>
                    <Typography variant="h4" sx={{ color: 'white', mt: 0.5 }}>{assignment?.department || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Training Date</Typography>
                    <Typography variant="h4" sx={{ color: 'white', mt: 0.5 }}>{formattedDate}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 4 }} />

              {/* Feedback items table */}
              <Box component="form" onSubmit={handleSubmit}>
                <Typography variant="h3" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                  Review Training Criteria & Provide Feedback
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  mb: 4
                }}>
                  <Table size="medium">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', width: 50 }}>#</TableCell>
                        <TableCell align="left" sx={{ color: 'white', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', minWidth: 250 }}>Induction Details / Topics</TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', width: 140 }}>Trainer Feedback</TableCell>
                        <TableCell align="center" sx={{ color: 'white', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', width: 150 }}>Your Status</TableCell>
                        <TableCell align="left" sx={{ color: 'white', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', minWidth: 250 }}>Your Remarks / Comments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.map((detail, idx) => (
                        <TableRow key={detail.id} sx={{
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                          bgcolor: detail.traineeStatus === 'UNDERSTOOD' ? 'rgba(46, 125, 50, 0.03)' :
                                   detail.traineeStatus === 'NEED MORE TRAINING' ? 'rgba(211, 47, 47, 0.03)' : 'inherit'
                        }}>
                          <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)' }}>{idx + 1}</TableCell>
                          <TableCell align="left" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                              {detail.inductionDetails || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                              {detail.trainerComments || 'No comments'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <Stack direction="row" spacing={1.5} justifyContent="center">
                              <Tooltip title="I Understood" placement="top" arrow>
                                <IconButton
                                  size="medium"
                                  onClick={() => updateDetail(detail.id, 'traineeStatus', 'UNDERSTOOD')}
                                  sx={{
                                    border: '1.5px solid',
                                    borderColor: detail.traineeStatus === 'UNDERSTOOD' ? theme.palette.success.main : 'rgba(255,255,255,0.2)',
                                    bgcolor: detail.traineeStatus === 'UNDERSTOOD' ? 'rgba(46, 125, 50, 0.15)' : 'transparent',
                                    color: detail.traineeStatus === 'UNDERSTOOD' ? theme.palette.success.light : 'rgba(255,255,255,0.5)',
                                    '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.25)' }
                                  }}
                                >
                                  <IconThumbUp size={18} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Need More Training" placement="top" arrow>
                                <IconButton
                                  size="medium"
                                  onClick={() => updateDetail(detail.id, 'traineeStatus', 'NEED MORE TRAINING')}
                                  sx={{
                                    border: '1.5px solid',
                                    borderColor: detail.traineeStatus === 'NEED MORE TRAINING' ? theme.palette.error.main : 'rgba(255,255,255,0.2)',
                                    bgcolor: detail.traineeStatus === 'NEED MORE TRAINING' ? 'rgba(211, 47, 47, 0.15)' : 'transparent',
                                    color: detail.traineeStatus === 'NEED MORE TRAINING' ? theme.palette.error.light : 'rgba(255,255,255,0.5)',
                                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.25)' }
                                  }}
                                >
                                  <IconThumbDown size={18} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                          <TableCell align="left" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <TextField
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                              value={detail.traineeComments || ''}
                              onChange={(e) => updateDetail(detail.id, 'traineeComments', e.target.value)}
                              placeholder="Describe your understanding or requirements..."
                              required
                              variant="outlined"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  color: 'white',
                                  '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                  '&.Mui-focused fieldset': { borderColor: theme.palette.primary.light }
                                },
                                '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.4)', opacity: 1 }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Action button */}
                <Stack direction="row" justifyContent="flex-end">
                  <AnimateButton>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      size="large"
                      disabled={submitting}
                      endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <IconSend size={18} />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: '1rem',
                        borderRadius: '8px',
                        textTransform: 'none',
                        boxShadow: '0px 4px 15px rgba(225, 0, 80, 0.2)'
                      }}
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </Button>
                  </AnimateButton>
                </Stack>

              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
}
